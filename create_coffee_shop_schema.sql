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

-- ============================
-- Example Test Data
-- ============================

INSERT INTO employee VALUES
    ('123-45-6789','Alice Smith','alice@example.com',55000.00),
    ('987-65-4321','Bob Jones','bob@example.com',45000.00);

INSERT INTO manager VALUES
    ('123-45-6789',25.00);

INSERT INTO barista VALUES
    ('987-65-4321');

INSERT INTO work_schedule VALUES
    ('987-65-4321','Monday','08:00','12:00'),
    ('987-65-4321','Tuesday','08:00','12:00');

INSERT INTO inventory_item VALUES
    ('Milk','oz',0.50,500.00),
    ('Beans','lb',10.00,100.00);

INSERT INTO menu_item VALUES
    ('Latte',12,'coffee',3.50,TRUE),
    ('IcedTea',16,'tea',2.75,FALSE);

INSERT INTO recipe(menu_item_name) VALUES
    ('Latte'),
    ('IcedTea');

INSERT INTO preparation_step(recipe_id, step_number, step_name) VALUES
    (1,1,'Steam Milk'),
    (1,2,'Brew Espresso'),
    (2,1,'Brew Tea'),
    (2,2,'Add Ice');

INSERT INTO recipe_ingredient VALUES
    (1,'Milk',8.00,'oz'),
    (1,'Beans',0.10,'lb');

INSERT INTO "order"(timestamp, payment_method) VALUES
    ('2025-04-15 09:30','cash'),
    ('2025-04-15 10:00','credit_card');

INSERT INTO order_line_item VALUES
    (1,'Latte',2),
    (2,'IcedTea',1);

INSERT INTO promotion(start_time, end_time, discounted_price) VALUES
    ('2025-04-20 08:00','2025-04-20 10:00',3.00);

INSERT INTO promotion_item VALUES
    (1,'Latte');
