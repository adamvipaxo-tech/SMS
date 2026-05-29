-- Stock Management System (SMS) Database
-- Run: mysql -u root -p < sms_schema.sql

CREATE DATABASE IF NOT EXISTS SMS
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE SMS;

-- ─── Product ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Product (
  productCode      VARCHAR(20)  NOT NULL PRIMARY KEY,
  productName      VARCHAR(120) NOT NULL,
  category         VARCHAR(60)  NOT NULL,
  quantityInStock  INT          NOT NULL DEFAULT 0 CHECK (quantityInStock >= 0),
  unitPrice        DECIMAL(12,2) NOT NULL CHECK (unitPrice >= 0),
  supplierName     VARCHAR(120) NOT NULL,
  dateReceived     DATE         NOT NULL,
  createdAt        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── Warehouse ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Warehouse (
  warehouseCode     VARCHAR(20)  NOT NULL PRIMARY KEY,
  warehouseName     VARCHAR(120) NOT NULL,
  warehouseLocation VARCHAR(200) NOT NULL,
  createdAt         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ─── StockTransaction ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS StockTransaction (
  transactionId   INT AUTO_INCREMENT PRIMARY KEY,
  transactionDate DATE         NOT NULL,
  quantityMoved   INT          NOT NULL CHECK (quantityMoved > 0),
  transactionType ENUM('STOCK_IN', 'STOCK_OUT') NOT NULL,
  productCode     VARCHAR(20)  NOT NULL,
  warehouseCode   VARCHAR(20)  NOT NULL,
  createdAt       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tx_product
    FOREIGN KEY (productCode) REFERENCES Product(productCode)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_tx_warehouse
    FOREIGN KEY (warehouseCode) REFERENCES Warehouse(warehouseCode)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_tx_date (transactionDate),
  INDEX idx_tx_type (transactionType)
);

-- ─── User (login) ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User (
  userId    INT AUTO_INCREMENT PRIMARY KEY,
  username  VARCHAR(50)  NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Default user is created by backend on first start (manager / manager123)
