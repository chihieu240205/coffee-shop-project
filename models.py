from typing import Optional, List
from datetime import datetime, time
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel

class Employee(SQLModel, table=True):
    __tablename__ = "employee"
    ssn: str = Field(primary_key=True, max_length=11)
    name: str = Field(nullable=False)
    email: str = Field(nullable=False, unique=True, index=True)
    password_hash: str = Field(nullable=False)
    salary: float = Field(nullable=False)

    manager: Optional["Manager"] = Relationship(back_populates="employee")
    barista: Optional["Barista"] = Relationship(back_populates="employee")

class Manager(SQLModel, table=True):
    __tablename__ = "manager"
    ssn: str = Field(foreign_key="employee.ssn", primary_key=True)
    ownership_percentage: float = Field(nullable=False)

    employee: Employee = Relationship(back_populates="manager")

class Barista(SQLModel, table=True):
    __tablename__ = "barista"
    ssn: str = Field(foreign_key="employee.ssn", primary_key=True)
    employee: Employee = Relationship(back_populates="barista")
    schedule: List["WorkSchedule"] = Relationship(back_populates="barista")

class WorkSchedule(SQLModel, table=True):
    __tablename__ = "work_schedule"
    ssn: str = Field(foreign_key="barista.ssn", primary_key=True)
    day_of_week: str = Field(primary_key=True)
    start_time: time = Field(primary_key=True)
    end_time: time = Field(nullable=False)

    barista: Barista = Relationship(back_populates="schedule")

class AccountingEntry(SQLModel, table=True):
    __tablename__ = "accounting_entry"
    timestamp: datetime = Field(primary_key=True)
    balance: float = Field(nullable=False)

class InventoryItem(SQLModel, table=True):
    __tablename__ = "inventory_item"
    name: str = Field(primary_key=True)
    unit: str = Field(nullable=False)
    price_per_unit: float = Field(nullable=False)
    amount_in_stock: float = Field(nullable=False)

    recipe_ingredients: List["RecipeIngredient"] = Relationship(back_populates="inventory_item")

class MenuItem(SQLModel, table=True):
    __tablename__ = "menu_item"
    name: str = Field(primary_key=True)
    size_ounces: int = Field(nullable=False)
    type: str = Field(nullable=False)
    price: float = Field(nullable=False)
    is_hot: bool = Field(nullable=False)

    recipe: Optional["Recipe"] = Relationship(back_populates="menu_item")
    order_line_items: List["OrderLineItem"] = Relationship(back_populates="menu_item")
    promotion_items: List["PromotionItem"] = Relationship(back_populates="menu_item")

class Recipe(SQLModel, table=True):
    __tablename__ = "recipe"
    recipe_id: Optional[int] = Field(default=None, primary_key=True)
    menu_item_name: str = Field(foreign_key="menu_item.name", nullable=False, unique=True)

    menu_item: MenuItem = Relationship(back_populates="recipe")
    preparation_steps: List["PreparationStep"] = Relationship(
        back_populates="recipe",
        sa_relationship_kwargs={"order_by": "PreparationStep.step_number"}
    )
    recipe_ingredients: List["RecipeIngredient"] = Relationship(back_populates="recipe")

class PreparationStep(SQLModel, table=True):
    __tablename__ = "preparation_step"
    recipe_id: int = Field(foreign_key="recipe.recipe_id", primary_key=True)
    step_number: int = Field(primary_key=True)
    step_name: str = Field(nullable=False)
    step_description: Optional[str] = None

    recipe: Recipe = Relationship(back_populates="preparation_steps")

class RecipeIngredient(SQLModel, table=True):
    __tablename__ = "recipe_ingredient"
    recipe_id: int = Field(foreign_key="recipe.recipe_id", primary_key=True)
    inventory_item_name: str = Field(foreign_key="inventory_item.name", primary_key=True)
    quantity: float = Field(nullable=False)
    unit: str = Field(nullable=False)

    recipe: Recipe = Relationship(back_populates="recipe_ingredients")
    inventory_item: InventoryItem = Relationship(back_populates="recipe_ingredients")

class Order(SQLModel, table=True):
    __tablename__ = "order"
    order_id: int = Field(primary_key=True)
    timestamp: datetime = Field(nullable=False)
    payment_method: str = Field(nullable=False)

    line_items: List["OrderLineItem"] = Relationship(back_populates="order")

class OrderLineItem(SQLModel, table=True):
    __tablename__ = "order_line_item"
    order_id: int = Field(foreign_key="order.order_id", primary_key=True)
    menu_item_name: str = Field(foreign_key="menu_item.name", primary_key=True)
    quantity: int = Field(nullable=False)

    order: Order = Relationship(back_populates="line_items")
    menu_item: MenuItem = Relationship(back_populates="order_line_items")

class Promotion(SQLModel, table=True):
    __tablename__ = "promotion"
    promotion_id: int = Field(primary_key=True)
    start_time: datetime = Field(nullable=False)
    end_time: datetime = Field(nullable=False)
    discounted_price: float = Field(nullable=False)

    promotion_items: List["PromotionItem"] = Relationship(back_populates="promotion")

class PromotionItem(SQLModel, table=True):
    __tablename__ = "promotion_item"
    promotion_id: int = Field(foreign_key="promotion.promotion_id", primary_key=True)
    menu_item_name: str = Field(foreign_key="menu_item.name", primary_key=True)

    promotion: Promotion = Relationship(back_populates="promotion_items")
    menu_item: MenuItem = Relationship(back_populates="promotion_items")

# Pydantic DTOs
class EmployeeCreate(BaseModel):
    ssn: str
    name: str
    email: str
    salary: float
    password: str

class EmployeeRead(BaseModel):
    ssn: str
    name: str
    email: str
    salary: float

    model_config = {"from_attributes": True}

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    salary: Optional[float] = None
    password: Optional[str] = None

class InventoryItemCreate(BaseModel):
    name: str
    unit: str
    price_per_unit: float
    amount_in_stock: float

class Customer(SQLModel, table=True):
    __tablename__ = "customer"
    id: int = Field(primary_key=True)
    email: str = Field(unique=True, index=True, nullable=False)
    password_hash: str = Field(nullable=False)
    name: Optional[str] = None

class CustomerCreate(BaseModel):
    email: str
    password: str
    name: str

class CustomerRead(BaseModel):
    id: int
    email: str
    name: Optional[str]

    model_config = {"from_attributes": True}
