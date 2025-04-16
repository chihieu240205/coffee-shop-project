-- Coffee Shop Management Database Schema

DROP TABLE IF EXISTS PromotionMenuItem;
DROP TABLE IF EXISTS Promotion;
DROP TABLE IF EXISTS OrderLineItem;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS RecipeIngredient;
DROP TABLE IF EXISTS PreparationStep;
DROP TABLE IF EXISTS Recipe;
DROP TABLE IF EXISTS Menu;
DROP TABLE IF EXISTS Accounting;
DROP TABLE IF EXISTS BaristaSchedule;
DROP TABLE IF EXISTS Manager;
DROP TABLE IF EXISTS Employee;
DROP TABLE IF EXISTS Inventory;

CREATE TABLE Inventory (
    item_name VARCHAR(50) PRIMARY KEY,
    unit VARCHAR(10) NOT NULL,
    price_per_unit NUMERIC(10,2) NOT NULL CHECK (price_per_unit >= 0),
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity >= 0)
);

CREATE TABLE Employee (
    ssn VARCHAR(11) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    salary NUMERIC(10,2) NOT NULL CHECK (salary >= 0),
    password VARCHAR(100) NOT NULL
);

CREATE TABLE Manager (
    ssn VARCHAR(11) PRIMARY KEY,
    percentage_ownership NUMERIC(5,2) NOT NULL CHECK (percentage_ownership BETWEEN 0 AND 100),
    FOREIGN KEY (ssn) REFERENCES Employee(ssn)
);

CREATE TABLE BaristaSchedule (
    ssn VARCHAR(11) NOT NULL,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    PRIMARY KEY (ssn, day_of_week),
    FOREIGN KEY (ssn) REFERENCES Employee(ssn),
    CHECK (start_time < end_time)
);

CREATE TABLE Accounting (
    entry_timestamp TIMESTAMP PRIMARY KEY,
    account_balance NUMERIC(12,2) NOT NULL
);

CREATE TABLE Menu (
    menu_item_name VARCHAR(100) PRIMARY KEY,
    size NUMERIC(5,2) NOT NULL CHECK (size > 0),
    type VARCHAR(20) NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price > 0),
    temperature VARCHAR(10) NOT NULL CHECK (temperature IN ('cold','hot'))
);

CREATE TABLE Recipe (
    menu_item_name VARCHAR(100) PRIMARY KEY,
    FOREIGN KEY (menu_item_name) REFERENCES Menu(menu_item_name)
);

CREATE TABLE PreparationStep (
    menu_item_name VARCHAR(100) NOT NULL,
    step_number INTEGER NOT NULL CHECK (step_number > 0),
    step_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (menu_item_name, step_number),
    FOREIGN KEY (menu_item_name) REFERENCES Recipe(menu_item_name)
);

CREATE TABLE RecipeIngredient (
    menu_item_name VARCHAR(100) NOT NULL,
    ingredient_name VARCHAR(50) NOT NULL,
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(10) NOT NULL,
    PRIMARY KEY (menu_item_name, ingredient_name),
    FOREIGN KEY (menu_item_name) REFERENCES Recipe(menu_item_name),
    FOREIGN KEY (ingredient_name) REFERENCES Inventory(item_name)
);

CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    order_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash','credit_card','app'))
);

CREATE TABLE OrderLineItem (
    order_id INTEGER NOT NULL,
    menu_item_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    PRIMARY KEY (order_id, menu_item_name),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (menu_item_name) REFERENCES Menu(menu_item_name)
);

CREATE TABLE Promotion (
    promotion_id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    discount_price NUMERIC(10,2) NOT NULL CHECK (discount_price > 0),
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (start_time < end_time)
);

CREATE TABLE PromotionMenuItem (
    promotion_id INTEGER NOT NULL,
    menu_item_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (promotion_id, menu_item_name),
    FOREIGN KEY (promotion_id) REFERENCES Promotion(promotion_id),
    FOREIGN KEY (menu_item_name) REFERENCES Menu(menu_item_name)
);

CREATE INDEX idx_employee_email ON Employee(email);
CREATE INDEX idx_barista_day ON BaristaSchedule(day_of_week);
CREATE INDEX idx_menu_type ON Menu(type);
CREATE INDEX idx_orders_timestamp ON Orders(order_timestamp);
CREATE INDEX idx_recipeingredient_item ON RecipeIngredient(ingredient_name);

INSERT INTO Inventory (item_name, unit, price_per_unit, quantity) VALUES
    ('milk', 'ounce', 0.33, 500),
    ('beans', 'lb', 10.00, 100),
    ('sugar', 'ounce', 0.05, 1000);

INSERT INTO Employee (ssn, name, email, salary, password) VALUES
    ('123-45-6789', 'Alice Johnson', 'alice@example.com', 50000.00, 'hashed_password1'),
    ('987-65-4321', 'Bob Smith', 'bob@example.com', 45000.00, 'hashed_password2');

INSERT INTO Manager (ssn, percentage_ownership) VALUES
    ('123-45-6789', 20.00);

INSERT INTO BaristaSchedule (ssn, day_of_week, start_time, end_time) VALUES
    ('987-65-4321', 'Monday', '08:00:00', '12:00:00'),
    ('987-65-4321', 'Tuesday', '08:00:00', '12:00:00'),
    ('987-65-4321', 'Friday', '15:00:00', '18:00:00');

INSERT INTO Menu (menu_item_name, size, type, price, temperature) VALUES
    ('Latte', 12.0, 'coffee', 4.50, 'hot'),
    ('Iced Tea', 16.0, 'tea', 3.75, 'cold');

INSERT INTO Recipe (menu_item_name) VALUES ('Latte');

INSERT INTO PreparationStep (menu_item_name, step_number, step_name) VALUES
    ('Latte', 1, 'Grind Beans'),
    ('Latte', 2, 'Boil Water'),
    ('Latte', 3, 'Froth Milk');

INSERT INTO RecipeIngredient (menu_item_name, ingredient_name, quantity, unit) VALUES
    ('Latte', 'beans', 0.1, 'lb'),
    ('Latte', 'milk', 8, 'ounce');

INSERT INTO Orders (payment_method) VALUES ('credit_card');
INSERT INTO OrderLineItem (order_id, menu_item_name, quantity) VALUES (1, 'Latte', 2);

INSERT INTO Promotion (description, discount_price, day_of_week, start_time, end_time)
VALUES ('Monday Espresso-Croissant Combo', 3.50, 'Monday', '08:00:00', '10:00:00');

INSERT INTO PromotionMenuItem (promotion_id, menu_item_name) VALUES (1, 'Latte');
