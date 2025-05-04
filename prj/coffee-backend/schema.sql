-- ============================
-- COFFEE SHOP DATABASE SCHEMA
-- ============================

-- 1. EMPLOYEES
CREATE TABLE employee (
  ssn            CHAR(11)    PRIMARY KEY,
  name           TEXT        NOT NULL,
  email          TEXT        UNIQUE NOT NULL,
  password_hash  TEXT        NOT NULL,
  salary         NUMERIC(12,2) NOT NULL
);
CREATE INDEX idx_employee_email ON employee(email);

-- 2. MANAGERS (subset of employees)
CREATE TABLE manager (
  ssn                    CHAR(11)      PRIMARY KEY
                           REFERENCES employee(ssn) ON DELETE CASCADE,
  ownership_percentage   NUMERIC(5,2)  NOT NULL
);

-- 3. BARISTAS (subset of employees)
CREATE TABLE barista (
  ssn   CHAR(11) PRIMARY KEY
           REFERENCES employee(ssn) ON DELETE CASCADE
);

-- 4. WORK SCHEDULE (for baristas)
CREATE TABLE work_schedule (
  id            SERIAL        PRIMARY KEY,
  barista_ssn   CHAR(11)      NOT NULL
                   REFERENCES barista(ssn) ON DELETE CASCADE,
  day_of_week   SMALLINT      NOT NULL,
  start_time    TIME          NOT NULL,
  end_time      TIME          NOT NULL
);
CREATE INDEX idx_work_schedule_barista ON work_schedule(barista_ssn);

-- 5. INVENTORY ITEMS (stock)
CREATE TABLE inventory_item (
  name            TEXT            PRIMARY KEY,
  unit            TEXT            NOT NULL,
  cost_per_unit   NUMERIC(10,4)   NOT NULL,
  quantity_on_hand NUMERIC(12,4)  NOT NULL
);

-- 6. MENU ITEMS
CREATE TABLE menu_item (
  name      TEXT           PRIMARY KEY,
  size_oz   INT            NOT NULL,
  type      TEXT           NOT NULL,
  price     NUMERIC(10,2)  NOT NULL,
  is_cold   BOOLEAN        NOT NULL
);

-- 7. RECIPES (one per menu item)
CREATE TABLE recipe (
  menu_item_name  TEXT    PRIMARY KEY
                      REFERENCES menu_item(name) ON DELETE CASCADE
);

-- 8. PREPARATION STEPS
CREATE TABLE preparation_step (
  id         SERIAL      PRIMARY KEY,
  recipe_id  TEXT        NOT NULL
                   REFERENCES recipe(menu_item_name) ON DELETE CASCADE,
  step_num   INT         NOT NULL,
  description TEXT       NOT NULL
);
CREATE INDEX idx_preparation_step_recipe ON preparation_step(recipe_id);

-- 9. RECIPE INGREDIENTS
CREATE TABLE recipe_ingredient (
  id                    SERIAL      PRIMARY KEY,
  recipe_id             TEXT        NOT NULL
                         REFERENCES recipe(menu_item_name) ON DELETE CASCADE,
  inventory_item_name   TEXT        NOT NULL
                         REFERENCES inventory_item(name) ON DELETE RESTRICT,
  quantity              NUMERIC(12,4) NOT NULL,
  unit                  TEXT        NOT NULL
);
CREATE INDEX idx_recipe_ingredient_inventory ON recipe_ingredient(inventory_item_name);

-- 10. ORDERS
CREATE TABLE "order" (
  id             SERIAL       PRIMARY KEY,
  timestamp      TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  payment_method TEXT         NOT NULL
);
CREATE INDEX idx_order_timestamp ON "order"(timestamp);

-- 11. ORDER LINE ITEMS
CREATE TABLE order_line_item (
  order_id        INT       NOT NULL
                       REFERENCES "order"(id) ON DELETE CASCADE,
  menu_item_name  TEXT      NOT NULL
                       REFERENCES menu_item(name) ON DELETE RESTRICT,
  quantity        INT       NOT NULL,
  unit_price      NUMERIC(10,2) NOT NULL,
  PRIMARY KEY(order_id, menu_item_name)
);
CREATE INDEX idx_order_line_item_menu_item ON order_line_item(menu_item_name);

-- 12. ACCOUNTING ENTRIES
CREATE TABLE accounting_entry (
  id        SERIAL      PRIMARY KEY,
  entry_ts  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  balance   NUMERIC(14,2) NOT NULL
);
CREATE INDEX idx_accounting_entry_ts ON accounting_entry(entry_ts);

-- 13. PROMOTIONS
CREATE TABLE promotion (
  id          SERIAL     PRIMARY KEY,
  description TEXT,
  start_ts    TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  end_ts      TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- 14. PROMOTION ITEMS (override prices during promos)
CREATE TABLE promotion_item (
  promotion_id    INT     NOT NULL
                       REFERENCES promotion(id) ON DELETE CASCADE,
  menu_item_name  TEXT    NOT NULL
                       REFERENCES menu_item(name) ON DELETE CASCADE,
  promo_price     NUMERIC(10,2) NOT NULL,
  PRIMARY KEY(promotion_id, menu_item_name)
);
CREATE INDEX idx_promotion_item_menu_item ON promotion_item(menu_item_name);
