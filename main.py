from typing import List, Literal
from datetime import datetime, date
import httpx
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import select, delete, Session, func

from database import init_db, get_session
from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
    require_manager_role,
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
)

app = FastAPI()

def protected():
    """Dependency to require any authenticated user"""
    return Depends(get_current_user)

class MeResp(BaseModel):
    ssn: str
    name: str
    email: str
    salary: float
    role: Literal["manager", "barista"]

    model_config = {"from_attributes": True}

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/me", response_model=MeResp, dependencies=[protected()])
def read_current_user(
    current: Employee = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # determine role
    is_mgr = session.exec(select(Manager).where(Manager.ssn == current.ssn)).first()
    role = "manager" if is_mgr else "barista"
    return MeResp(
        ssn=current.ssn,
        name=current.name,
        email=current.email,
        salary=current.salary,
        role=role,
    )

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ---- 0a) SIGNUP ----
class SignupPayload(BaseModel):
    ssn: str
    name: str
    email: str
    salary: float
    password: str

@app.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    user_in: SignupPayload,
    session: Session = Depends(get_session),
):
    # prevent duplicate email
    if session.exec(select(Employee).where(Employee.email == user_in.email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # create employee
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
    # issue token
    token = create_access_token({"sub": new_emp.email})
    return {"access_token": token, "token_type": "bearer"}

# ---- 1) LOGIN / TOKEN ----
@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# ---- 2) LISTING ENDPOINTS ----
@app.get("/employees/", response_model=List[Employee], dependencies=[protected()])
def list_employees(session: Session = Depends(get_session)):
    return session.exec(select(Employee)).all()

@app.get("/managers/", response_model=List[Manager], dependencies=[protected()])
def list_managers(session: Session = Depends(get_session)):
    return session.exec(select(Manager)).all()

@app.get("/baristas/", response_model=List[Barista], dependencies=[protected()])
def list_baristas(session: Session = Depends(get_session)):
    return session.exec(select(Barista)).all()

@app.get("/work_schedules/", response_model=List[WorkSchedule], dependencies=[protected()])
def list_work_schedules(session: Session = Depends(get_session)):
    return session.exec(select(WorkSchedule)).all()

@app.get("/accounting_entries/", response_model=List[AccountingEntry], dependencies=[protected()])
def list_accounting_entries(session: Session = Depends(get_session)):
    return session.exec(select(AccountingEntry)).all()

@app.get("/inventory_items/", response_model=List[InventoryItem], dependencies=[protected()])
def list_inventory_items(session: Session = Depends(get_session)):
    return session.exec(select(InventoryItem)).all()

@app.get("/menu_items/", response_model=List[MenuItem], dependencies=[protected()])
def list_menu_items(session: Session = Depends(get_session)):
    return session.exec(select(MenuItem)).all()

@app.get("/recipes/", response_model=List[Recipe], dependencies=[protected()])
def list_recipes(session: Session = Depends(get_session)):
    return session.exec(select(Recipe)).all()

@app.get("/preparation_steps/", response_model=List[PreparationStep], dependencies=[protected()])
def list_preparation_steps(session: Session = Depends(get_session)):
    return session.exec(select(PreparationStep)).all()

@app.get("/recipe_ingredients/", response_model=List[RecipeIngredient], dependencies=[protected()])
def list_recipe_ingredients(session: Session = Depends(get_session)):
    return session.exec(select(RecipeIngredient)).all()

@app.get("/orders/", response_model=List[Order], dependencies=[protected()])
def list_orders(session: Session = Depends(get_session)):
    return session.exec(select(Order)).all()

@app.get("/order_line_items/", response_model=List[OrderLineItem], dependencies=[protected()])
def list_order_line_items(session: Session = Depends(get_session)):
    return session.exec(select(OrderLineItem)).all()

@app.get("/promotions/", response_model=List[Promotion], dependencies=[protected()])
def list_promotions(session: Session = Depends(get_session)):
    return session.exec(select(Promotion)).all()

@app.get("/promotion_items/", response_model=List[PromotionItem], dependencies=[protected()])
def list_promotion_items(session: Session = Depends(get_session)):
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
    session: Session = Depends(get_session),
):
    item = session.get(InventoryItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.quantity_on_hand += payload.quantity
    cost = item.cost_per_unit * payload.quantity
    last = session.exec(select(AccountingEntry).order_by(AccountingEntry.timestamp.desc())).first()
    prev_bal = last.balance if last else 0.0
    entry = AccountingEntry(entry_ts=datetime.utcnow(), balance=prev_bal - cost)
    session.add(item)
    session.add(entry)
    session.commit()
    session.refresh(item)
    return item

# ---- 4) CREATE ORDER (barista) ----
class OrderItemIn(BaseModel):
    menu_item_name: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    payment_method: str

@app.post("/orders", include_in_schema=False)
@app.post("/orders/", response_model=Order, dependencies=[protected()])
def create_order(
    order_in: OrderCreate,
    session: Session = Depends(get_session),
):
    # 1) create the order header
    order = Order(timestamp=datetime.utcnow(), payment_method=order_in.payment_method)
    session.add(order)
    session.commit()
    session.refresh(order)

    total_income = 0.0
    total_cost = 0.0

    # 2) for each requested item
    for it in order_in.items:
        menu = session.get(MenuItem, it.menu_item_name)
        if not menu:
            raise HTTPException(status_code=404, detail=f"Menu item {it.menu_item_name} not found")

        # record the line‐item
        oli = OrderLineItem(order_id=order.order_id, menu_item_name=it.menu_item_name, quantity=it.quantity)
        session.add(oli)
        total_income += menu.price * it.quantity

        # look up its recipe
        recipe = session.exec(
            select(Recipe).where(Recipe.menu_item_name == it.menu_item_name)
        ).first()
        if not recipe:
            raise HTTPException(
                status_code=400,
                detail=f"No recipe defined for menu item {it.menu_item_name}"
            )

        # deduct ingredients
        for ri in recipe.recipe_ingredients:
            inv = session.get(InventoryItem, ri.inventory_item_name)
            inv.amount_in_stock -= ri.quantity * it.quantity
            total_cost += ri.quantity * it.quantity * inv.price_per_unit
            session.add(inv)

    # 3) update accounting
    last = session.exec(
        select(AccountingEntry).order_by(AccountingEntry.timestamp.desc())
    ).first()
    prev_bal = last.balance if last else 0.0
    entry = AccountingEntry(timestamp=datetime.utcnow(), balance=prev_bal + total_income - total_cost)
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
    session: Session = Depends(get_session),
):
    hashed_pw = get_password_hash(emp_in.password)
    emp = Employee(ssn=emp_in.ssn, name=emp_in.name, email=emp_in.email, salary=emp_in.salary, password_hash=hashed_pw)
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
    session: Session = Depends(get_session),
):
    emp = session.get(Employee, ssn)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    for field, value in emp_up.dict(exclude_unset=True).items():
        setattr(emp, field, get_password_hash(value) if field == 'password' else value)
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
    session: Session = Depends(get_session),
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
    cost_per_unit: float
    quantity_on_hand: float

@app.post(
    "/inventory_items/",
    response_model=InventoryItem,
    status_code=status.HTTP_201_CREATED,
    dependencies=[protected()],
)
def create_inventory_item(
    item_in: InventoryItemCreate,
    session: Session = Depends(get_session),
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
    session: Session = Depends(get_session),
):
    item = session.get(InventoryItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in item_up.dict().items(): setattr(item, k, v)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.delete(
    "/inventory_items/{name}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[protected(), Depends(require_manager_role)],
)
def delete_inventory_item(
    name: str,
    session: Session = Depends(get_session),
):
    item = session.get(InventoryItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()

# ---- 7) MANAGING MENU ITEMS (manager only) ----
class MenuItemCreate(BaseModel):
    name: str
    size_ounces: int
    type: str
    price: float
    is_hot: bool

@app.post(
    "/menu_items/",
    response_model=MenuItem,
    status_code=status.HTTP_201_CREATED,
    dependencies=[protected(), Depends(require_manager_role)],
)
def create_menu_item(
    item_in: MenuItemCreate,
    session: Session = Depends(get_session),
):
    if session.get(MenuItem, item_in.name):
        raise HTTPException(status_code=400, detail="Menu item already exists")
    item = MenuItem(**item_in.dict())
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.patch(
    "/menu_items/{name}",
    response_model=MenuItem,
    dependencies=[protected(), Depends(require_manager_role)],
)
def update_menu_item(
    name: str,
    item_up: MenuItemCreate,
    session: Session = Depends(get_session),
):
    item = session.get(MenuItem, name)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for k, v in item_up.dict().items(): setattr(item, k, v)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@app.delete(
    "/menu_items/{name}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[protected(), Depends(require_manager_role)],
)
def delete_menu_item(
    name: str,
    session: Session = Depends(get_session),
):
    if not session.get(MenuItem, name):
        raise HTTPException(status_code=404, detail="Menu item not found")
    # delete associated recipe first
    session.exec(delete(Recipe).where(Recipe.menu_item_name == name))
    # delete the menu item
    session.exec(delete(MenuItem).where(MenuItem.name == name))
    session.commit()

# ---- 8) CREATE RECIPE & INGREDIENT ----
class RecipeCreate(BaseModel):
    menu_item_name: str

@app.post("/recipes/", status_code=201, dependencies=[protected()])
def create_recipe(
    rc: RecipeCreate,
    session: Session = Depends(get_session),
):
    if not session.get(MenuItem, rc.menu_item_name):
        raise HTTPException(status_code=404, detail="Menu item not found")
    existing = session.exec(select(Recipe).where(Recipe.menu_item_name == rc.menu_item_name)).first()
    if existing:
        return existing
    r = Recipe(menu_item_name=rc.menu_item_name)
    session.add(r)
    session.commit()
    session.refresh(r)
    return r

class RecipeIngredientCreate(BaseModel):
    recipe_id: int
    inventory_item_name: str
    quantity: float
    unit: str

@app.post("/recipe_ingredients/", status_code=201, dependencies=[protected()])
def create_recipe_ingredient(
    ric: RecipeIngredientCreate,
    session: Session = Depends(get_session),
):
    if not session.get(Recipe, ric.recipe_id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not session.get(InventoryItem, ric.inventory_item_name):
        raise HTTPException(status_code=404, detail="Inventory item not found")
    ri = RecipeIngredient(**ric.dict())
    session.add(ri)
    session.commit()
    return ri
    

# ---- 9) COFFEESHOP ANALYTICS (manager only) ----
@app.get(
    "/analytics/revenue/",
    dependencies=[Depends(require_manager_role)]
)
def revenue_report(
    start: date = Query(..., description="YYYY-MM-DD"),
    end:   date = Query(..., description="YYYY-MM-DD"),
    session: Session = Depends(get_session),
):
    # total sales income
    income = session.exec(
        select(func.sum(OrderLineItem.quantity * MenuItem.price))
        .join(MenuItem, OrderLineItem.menu_item_name == MenuItem.name)
        .join(Order, OrderLineItem.order_id == Order.order_id)
        .where(func.date(Order.timestamp).between(start, end))
    ).one() or 0
    # total ingredient cost
    cost = session.exec(
        select(func.sum(
            RecipeIngredient.quantity
            * OrderLineItem.quantity
            * InventoryItem.price_per_unit
        ))
        .join(Recipe, Recipe.recipe_id == RecipeIngredient.recipe_id)
        .join(OrderLineItem, OrderLineItem.menu_item_name == Recipe.menu_item_name)
        .join(Order, OrderLineItem.order_id == Order.order_id)
        .join(InventoryItem, InventoryItem.name == RecipeIngredient.inventory_item_name)
        .where(Order.timestamp.between(start, end))
    ).one() or 0
    return {"start": start, "end": end, "revenue": income - cost}

@app.get(
    "/analytics/popular/",
    dependencies=[Depends(require_manager_role)]
)
def top_k_popular(
    month: int = Query(..., ge=1, le=12),
    year:  int = Query(...),
    k:     int = Query(3),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(
            OrderLineItem.menu_item_name,
            func.sum(OrderLineItem.quantity).label("sold")
        )
        .join(Order, OrderLineItem.order_id == Order.order_id)
        .where(
            func.extract("year", Order.timestamp) == year,
            func.extract("month", Order.timestamp) == month,
        )
        .group_by(OrderLineItem.menu_item_name)
        .order_by(func.sum(OrderLineItem.quantity).desc())
        .limit(k)
    ).all()
    return [{"name": r.menu_item_name, "sold": r.sold} for r in rows]


@app.get(
    "/analytics/top-revenue/",
    dependencies=[Depends(require_manager_role)]
)
def top_k_revenue(
    start: date = Query(..., description="YYYY-MM-DD"),
    end:   date = Query(..., description="YYYY-MM-DD"),
    k:     int  = Query(3),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        select(
            OrderLineItem.menu_item_name,
            func.sum(OrderLineItem.quantity * MenuItem.price).label("revenue")
        )
        .join(MenuItem, OrderLineItem.menu_item_name == MenuItem.name)
        .join(Order, OrderLineItem.order_id == Order.order_id)
        .where(func.date(Order.timestamp).between(start, end))
        .group_by(OrderLineItem.menu_item_name)
        .order_by(func.sum(OrderLineItem.quantity * MenuItem.price).desc())
        .limit(k)
    ).all()
    return [{"name": r.menu_item_name, "revenue": r.revenue} for r in rows]

# ↓↓↓ INSERT LLM INTEGRATION HERE ↓↓↓

@app.get("/llm/description/{drink}", dependencies=[protected()])
async def drink_description(drink: str):
    prompt = f"Give me a brief history and serving suggestions for the drink called '{drink}'."
    resp = httpx.post("http://localhost:11434/api/chat", json={
        "model": "llama2",
        "prompt": prompt
    })
    resp.raise_for_status()
    return {"description": resp.json()["choices"][0]["message"]["content"]}

@app.post("/llm/suggest/", dependencies=[protected()])
async def order_suggestions(order: OrderCreate):
    names = [it.menu_item_name for it in order.items]
    prompt = f"I have ordered {', '.join(names)}. What else would you enjoy ordering at a coffee shop?"
    resp = httpx.post("http://localhost:11434/api/chat", json={
        "model": "llama2",
        "prompt": prompt
    })
    resp.raise_for_status()
    return {"suggestions": resp.json()["choices"][0]["message"]["content"].splitlines()}

# ---- finally, enable CORS for your frontend ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
