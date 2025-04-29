-- ============================
-- 1. EMPLOYEE & SPECIALIZATIONS
-- ============================

CREATE TABLE employee (
    ssn CHAR(11) PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    salary NUMERIC(12,2) NOT NULL
);

CREATE TABLE manager (
    ssn CHAR(11) PRIMARY KEY REFERENCES employee(ssn),
    ownership_percentage NUMERIC(5,2) NOT NULL
);

CREATE TABLE barista (
    ssn CHAR(11) PRIMARY KEY REFERENCES employee(ssn)
);

CREATE TABLE work_schedule (
    ssn CHAR(11) NOT NULL REFERENCES barista(ssn),
    day_of_week TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    PRIMARY KEY (ssn, day_of_week, start_time)
);

-- ============================
-- 2. ACCOUNTING
-- ============================

CREATE TABLE accounting_entry (
    timestamp TIMESTAMP WITHOUT TIME ZONE PRIMARY KEY,
    balance NUMERIC(12,2) NOT NULL
);

-- ============================
-- 3. INVENTORY
-- ============================

CREATE TABLE inventory_item (
    name TEXT PRIMARY KEY,
    unit TEXT NOT NULL,
    price_per_unit NUMERIC(10,2) NOT NULL,
    amount_in_stock NUMERIC(12,2) NOT NULL
);

-- ============================
-- 4. MENU & RECIPES
-- ============================

CREATE TABLE menu_item (
    name TEXT PRIMARY KEY,
    size_ounces INT NOT NULL,
    type TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_hot BOOLEAN NOT NULL
);

CREATE TABLE recipe (
    recipe_id SERIAL PRIMARY KEY,
    menu_item_name TEXT NOT NULL UNIQUE REFERENCES menu_item(name)
);

CREATE TABLE preparation_step (
    recipe_id INT NOT NULL REFERENCES recipe(recipe_id),
    step_number INT NOT NULL,
    step_name TEXT NOT NULL,
    step_description TEXT,
    PRIMARY KEY (recipe_id, step_number)
);

CREATE TABLE recipe_ingredient (
    recipe_id INT NOT NULL REFERENCES recipe(recipe_id),
    inventory_item_name TEXT NOT NULL REFERENCES inventory_item(name),
    quantity NUMERIC(12,4) NOT NULL,
    unit TEXT NOT NULL,
    PRIMARY KEY (recipe_id, inventory_item_name)
);

-- ============================
-- 5. SALES (ORDERS)
-- ============================

CREATE TABLE "order" (
    order_id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    payment_method TEXT NOT NULL
);

CREATE TABLE order_line_item (
    order_id INT NOT NULL REFERENCES "order"(order_id),
    menu_item_name TEXT NOT NULL REFERENCES menu_item(name),
    quantity INT NOT NULL,
    PRIMARY KEY (order_id, menu_item_name)
);

-- ============================
-- 6. PROMOTIONS (BONUS)
-- ============================

CREATE TABLE promotion (
    promotion_id SERIAL PRIMARY KEY,
    start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    discounted_price NUMERIC(10,2) NOT NULL
);

CREATE TABLE promotion_item (
    promotion_id INT NOT NULL REFERENCES promotion(promotion_id),
    menu_item_name TEXT NOT NULL REFERENCES menu_item(name),
    PRIMARY KEY (promotion_id, menu_item_name)
);

-- ============================
-- Indexes on FK columns
-- ============================

CREATE INDEX idx_manager_ssn ON manager(ssn);

CREATE INDEX idx_barista_ssn ON barista(ssn);

CREATE INDEX idx_work_schedule_ssn ON work_schedule(ssn);

CREATE INDEX idx_recipe_menu_item ON recipe(menu_item_name);

CREATE INDEX idx_prep_step_recipe ON preparation_step(recipe_id);

CREATE INDEX idx_recipe_ingr_inventory ON recipe_ingredient(inventory_item_name);

CREATE INDEX idx_order_timestamp ON "order"(timestamp);

CREATE INDEX idx_order_line_item_item ON order_line_item(menu_item_name);

CREATE INDEX idx_promotion_item_menu ON promotion_item(menu_item_name);

ALTER TABLE employee
  ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';