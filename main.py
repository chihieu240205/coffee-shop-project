# main.py

from typing import List, Literal
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import select, Session

from database import init_db, get_session
from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    require_manager_role,
    verify_password,
)
from models import (
    Employee,
    Manager,
    Barista,
    WorkSchedule,
    AccountingEntry,
    InventoryItem,
    MenuItem,
    Recipe,
    PreparationStep,
    RecipeIngredient,
    Order,
    OrderLineItem,
    Promotion,
    PromotionItem,
    EmployeeCreate,
    EmployeeRead,
    EmployeeUpdate,
    Customer,
    CustomerCreate,
    CustomerRead,
)

app = FastAPI()

class MeResp(BaseModel):
    ssn: str
    name: str
    email: str
    salary: float
    role: Literal["manager","barista"]
    
    model_config = {"from_attributes": True}

@app.get("/me", response_model=MeResp)
def read_current_user(
    current: Employee = Depends(get_current_user),
    session=Depends(get_session),
):
    # determine role
    is_mgr = session.exec(
        select(Manager).where(Manager.ssn == current.ssn)
    ).first()
    role = "manager" if is_mgr else "barista"

    # now manually construct MeResp
    return MeResp(
        ssn=current.ssn,
        name=current.name,
        email=current.email,
        salary=current.salary,
        role=role,
    )


# 0) Bootstrap the database
@app.on_event("startup")
def on_startup():
    init_db()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# ---- 0a) SIGNUP / REGISTER for employees (manager can still use POST /employees/) ----
class SignupPayload(BaseModel):
    ssn: str
    name: str
    email: str
    salary: float
    password: str


@app.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    user_in: SignupPayload,
    session=Depends(get_session),
):
    # 1) prevent duplicate emails
    existing = session.exec(
        select(Employee).where(Employee.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2) hash password & create employee
    hashed_pw = get_password_hash(user_in.password)
    new_emp = Employee(
        ssn=user_in.ssn,
        name=user_in.name,
        email=user_in.email,
        salary=user_in.salary,
        password_hash=hashed_pw,
    )
    session.add(new_emp)
    session.commit()
    session.refresh(new_emp)

    # 3) issue JWT
    token = create_access_token({"sub": new_emp.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": EmployeeRead.from_orm(new_emp),
    }


# ---- 1) LOGIN / TOKEN ----
@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session=Depends(get_session),
):
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
        
    is_mgr = session.exec(
        select(Manager).where(Manager.ssn == user.ssn)
    ).first() is not None
    role = "manager" if is_mgr else "barista"
    
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


# helper for protecting routes
def protected():
    return Depends(get_current_user)


# ---- 2) LISTING ENDPOINTS (all protected) ----
@app.get("/employees/", response_model=List[Employee], dependencies=[protected()])
def list_employees(session=Depends(get_session)):
    return session.exec(select(Employee)).all()

@app.get("/managers/", response_model=List[Manager], dependencies=[protected()])
def list_managers(session=Depends(get_session)):
    return session.exec(select(Manager)).all()

@app.get("/baristas/", response_model=List[Barista], dependencies=[protected()])
def list_baristas(session=Depends(get_session)):
    return session.exec(select(Barista)).all()

@app.get("/work_schedules/", response_model=List[WorkSchedule], dependencies=[protected()])
def list_work_schedules(session=Depends(get_session)):
    return session.exec(select(WorkSchedule)).all()

@app.get("/accounting_entries/", response_model=List[AccountingEntry], dependencies=[protected()])
def list_accounting_entries(session=Depends(get_session)):
    return session.exec(select(AccountingEntry)).all()

@app.get("/inventory_items/", response_model=List[InventoryItem], dependencies=[protected()])
def list_inventory_items(session=Depends(get_session)):
    return session.exec(select(InventoryItem)).all()

@app.get("/menu_items/", response_model=List[MenuItem], dependencies=[protected()])
def list_menu_items(session=Depends(get_session)):
    return session.exec(select(MenuItem)).all()

@app.get("/recipes/", response_model=List[Recipe], dependencies=[protected()])
def list_recipes(session=Depends(get_session)):
    return session.exec(select(Recipe)).all()

@app.get("/preparation_steps/", response_model=List[PreparationStep], dependencies=[protected()])
def list_preparation_steps(session=Depends(get_session)):
    return session.exec(select(PreparationStep)).all()

@app.get("/recipe_ingredients/", response_model=List[RecipeIngredient], dependencies=[protected()])
def list_recipe_ingredients(session=Depends(get_session)):
    return session.exec(select(RecipeIngredient)).all()

@app.get("/orders/", response_model=List[Order], dependencies=[protected()])
def list_orders(session=Depends(get_session)):
    return session.exec(select(Order)).all()

@app.get("/order_line_items/", response_model=List[OrderLineItem], dependencies=[protected()])
def list_order_line_items(session=Depends(get_session)):
    return session.exec(select(OrderLineItem)).all()

@app.get("/promotions/", response_model=List[Promotion], dependencies=[protected()])
def list_promotions(session=Depends(get_session)):
    return session.exec(select(Promotion)).all()

@app.get("/promotion_items/", response_model=List[PromotionItem], dependencies=[protected()])
def list_promotion_items(session=Depends(get_session)):
    return session.exec(select(PromotionItem)).all()


# ---- 3) INVENTORY REFILL ----
class RefillPayload(BaseModel):
    quantity: float

@app.post(
    "/inventory_items/{name}/refill",
    response_model=InventoryItem,
    dependencies=[protected()],
)
def refill_inventory(
    name: str,
    payload: RefillPayload,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    item = session.get(InventoryItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.amount_in_stock += payload.quantity
    cost = item.price_per_unit * payload.quantity

    last = session.exec(
        select(AccountingEntry).order_by(AccountingEntry.timestamp.desc())
    ).first()
    prev_bal = last.balance if last else 0.0

    entry = AccountingEntry(timestamp=datetime.utcnow(), balance=prev_bal - cost)
    session.add(item)
    session.add(entry)
    session.commit()
    session.refresh(item)
    return item


# ---- 4) CREATE ORDER (barista) ----
class OrderItem(BaseModel):
    menu_item_name: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItem]
    payment_method: str

@app.post("/orders/", response_model=Order, dependencies=[protected()])
def create_order(
    order_in: OrderCreate,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    order = Order(timestamp=datetime.utcnow(), payment_method=order_in.payment_method)
    session.add(order)
    session.commit()
    session.refresh(order)

    total_income = 0.0
    total_cost = 0.0

    for it in order_in.items:
        menu = session.get(MenuItem, it.menu_item_name)
        if not menu:
            raise HTTPException(status_code=404, detail=f"Menu item {it.menu_item_name} not found")

        oli = OrderLineItem(
            order_id=order.order_id,
            menu_item_name=it.menu_item_name,
            quantity=it.quantity,
        )
        session.add(oli)
        total_income += menu.price * it.quantity

        recipe = session.exec(
            select(Recipe).where(Recipe.menu_item_name == it.menu_item_name)
        ).one()
        for ri in recipe.recipe_ingredients:
            inv = session.get(InventoryItem, ri.inventory_item_name)
            inv.amount_in_stock -= ri.quantity * it.quantity
            total_cost += ri.quantity * it.quantity * inv.price_per_unit
            session.add(inv)

    last = session.exec(
        select(AccountingEntry).order_by(AccountingEntry.timestamp.desc())
    ).first()
    prev_bal = last.balance if last else 0.0
    new_bal = prev_bal + total_income - total_cost
    entry = AccountingEntry(timestamp=datetime.utcnow(), balance=new_bal)
    session.add(entry)

    session.commit()
    session.refresh(order)
    return order


# ---- 5) MANAGING EMPLOYEES (manager only) ----
@app.post(
    "/employees/",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[protected(), Depends(require_manager_role)],
)
def create_employee(
    emp_in: EmployeeCreate,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    hashed_pw = get_password_hash(emp_in.password)
    emp = Employee(
        ssn=emp_in.ssn,
        name=emp_in.name,
        email=emp_in.email,
        salary=emp_in.salary,
        password_hash=hashed_pw,
    )
    session.add(emp)
    session.commit()
    session.refresh(emp)
    return EmployeeRead.from_orm(emp)


@app.patch(
    "/employees/{ssn}",
    response_model=EmployeeRead,
    dependencies=[protected(), Depends(require_manager_role)],
)
def update_employee(
    ssn: str,
    emp_up: EmployeeUpdate,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    emp = session.get(Employee, ssn)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if emp_up.name is not None:
        emp.name = emp_up.name
    if emp_up.email is not None:
        emp.email = emp_up.email
    if emp_up.salary is not None:
        emp.salary = emp_up.salary
    if emp_up.password is not None:
        emp.password_hash = get_password_hash(emp_up.password)
    session.add(emp)
    session.commit()
    session.refresh(emp)
    return EmployeeRead.from_orm(emp)


@app.delete(
    "/employees/{ssn}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[protected(), Depends(require_manager_role)],
)
def delete_employee(
    ssn: str,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    emp = session.get(Employee, ssn)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    session.delete(emp)
    session.commit()


# ---- 6) MANAGING INVENTORY ITEMS ----
class InventoryItemCreate(BaseModel):
    name: str
    unit: str
    price_per_unit: float
    amount_in_stock: float


@app.post(
    "/inventory_items/",
    response_model=InventoryItem,
    status_code=status.HTTP_201_CREATED,
    dependencies=[protected()],
)
def create_inventory_item(
    item_in: InventoryItemCreate,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    if session.get(InventoryItem, item_in.name):
        raise HTTPException(status_code=400, detail="Item already exists")
    item = InventoryItem(**item_in.dict())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@app.patch(
    "/inventory_items/{name}",
    response_model=InventoryItem,
    dependencies=[protected()],
)
def update_inventory_item(
    name: str,
    item_up: InventoryItemCreate,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    item = session.get(InventoryItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in item_up.dict().items():
        setattr(item, k, v)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


@app.delete(
    "/inventory_items/{name}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[protected()],
)
def delete_inventory_item(
    name: str,
    session=Depends(get_session),
    current=Depends(get_current_user),
):
    item = session.get(InventoryItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()


# allow your front-end origin (or "*" for dev only)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# --- Customer signup/login (unchanged) ---
@app.post("/customers/signup", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def signup_customer(data: CustomerCreate, session=Depends(get_session)):
    if session.exec(select(Customer).where(Customer.email == data.email)).first():
        raise HTTPException(400, "Email already registered")
    cust = Customer(
        email=data.email,
        password_hash=get_password_hash(data.password),
        name=data.name,
    )
    session.add(cust)
    session.commit()
    session.refresh(cust)
    return cust


@app.post("/customers/token")
def login_customer(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session=Depends(get_session),
):
    stmt = select(Customer).where(Customer.email == form_data.username)
    cust = session.exec(stmt).first()
    if not cust or not verify_password(form_data.password, cust.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    token = create_access_token({"sub": cust.email})
    return {"access_token": token, "token_type": "bearer"}
