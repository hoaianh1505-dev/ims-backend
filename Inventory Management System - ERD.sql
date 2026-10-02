CREATE TYPE "user_role" AS ENUM (
  'ADMIN',
  'MANAGER',
  'STAFF'
);

CREATE TYPE "stock_transaction_type" AS ENUM (
  'IMPORT',
  'EXPORT',
  'TRANSFER',
  'ADJUSTMENT'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "username" varchar(50) UNIQUE NOT NULL,
  "password" varchar(255) NOT NULL,
  "display_name" varchar(100),
  "phone" varchar(20),
  "email" varchar(100),
  "avatar" varchar(500),
  "role" user_role NOT NULL DEFAULT 'STAFF',
  "must_change_password" boolean NOT NULL DEFAULT true,
  "is_active" boolean NOT NULL DEFAULT true,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "parent_id" uuid,
  "name" varchar(100) NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "units" (
  "id" uuid PRIMARY KEY,
  "name" varchar(50) UNIQUE NOT NULL,
  "symbol" varchar(20),
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "suppliers" (
  "id" uuid PRIMARY KEY,
  "name" varchar(150) NOT NULL,
  "code" varchar(50) UNIQUE,
  "contact_name" varchar(100),
  "email" varchar(100),
  "phone" varchar(20),
  "address" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY,
  "category_id" uuid,
  "unit_id" uuid,
  "supplier_id" uuid,
  "name" varchar(200) NOT NULL,
  "sku" varchar(100) UNIQUE NOT NULL,
  "barcode" varchar(100) UNIQUE,
  "description" text,
  "cost_price" decimal(15,2) NOT NULL DEFAULT 0,
  "selling_price" decimal(15,2) NOT NULL DEFAULT 0,
  "low_stock_threshold" int NOT NULL DEFAULT 10,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "product_images" (
  "id" uuid PRIMARY KEY,
  "product_id" uuid NOT NULL,
  "image_url" varchar(500) NOT NULL,
  "s3_key" varchar(255) NOT NULL,
  "is_primary" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "warehouses" (
  "id" uuid PRIMARY KEY,
  "manager_id" uuid,
  "name" varchar(150) NOT NULL,
  "code" varchar(50) UNIQUE NOT NULL,
  "address" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "warehouse_locations" (
  "id" uuid PRIMARY KEY,
  "warehouse_id" uuid NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "inventory" (
  "id" uuid PRIMARY KEY,
  "warehouse_id" uuid NOT NULL,
  "location_id" uuid,
  "product_id" uuid NOT NULL,
  "quantity" int NOT NULL DEFAULT 0,
  "updated_at" timestamp
);

CREATE TABLE "stock_transactions" (
  "id" uuid PRIMARY KEY,
  "type" stock_transaction_type NOT NULL,
  "reference_no" varchar(100) UNIQUE,
  "warehouse_id" uuid NOT NULL,
  "target_warehouse_id" uuid,
  "supplier_id" uuid,
  "created_by_user_id" uuid NOT NULL,
  "note" text,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "stock_transaction_items" (
  "id" uuid PRIMARY KEY,
  "transaction_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "location_id" uuid,
  "target_location_id" uuid,
  "quantity" int NOT NULL DEFAULT 0,
  "counted_quantity" int,
  "unit_price" decimal(15,2) NOT NULL DEFAULT 0,
  "total_price" decimal(15,2) NOT NULL DEFAULT 0
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "action" varchar(100) NOT NULL,
  "entity_name" varchar(100) NOT NULL,
  "entity_id" varchar(100),
  "details" json,
  "ip_address" varchar(45),
  "created_at" timestamp DEFAULT (now())
);

CREATE UNIQUE INDEX ON "inventory" ("warehouse_id", "location_id", "product_id");

COMMENT ON TABLE "inventory" IS 'Bảng theo dõi số lượng tồn kho theo thời gian thực (Realtime Stock Level)';

ALTER TABLE "categories" ADD FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "products" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "products" ADD FOREIGN KEY ("unit_id") REFERENCES "units" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "products" ADD FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "product_images" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "warehouses" ADD FOREIGN KEY ("manager_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "warehouse_locations" ADD FOREIGN KEY ("warehouse_id") REFERENCES "warehouses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory" ADD FOREIGN KEY ("warehouse_id") REFERENCES "warehouses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory" ADD FOREIGN KEY ("location_id") REFERENCES "warehouse_locations" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "inventory" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transactions" ADD FOREIGN KEY ("warehouse_id") REFERENCES "warehouses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transactions" ADD FOREIGN KEY ("target_warehouse_id") REFERENCES "warehouses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transactions" ADD FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transactions" ADD FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transaction_items" ADD FOREIGN KEY ("transaction_id") REFERENCES "stock_transactions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transaction_items" ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transaction_items" ADD FOREIGN KEY ("location_id") REFERENCES "warehouse_locations" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "stock_transaction_items" ADD FOREIGN KEY ("target_location_id") REFERENCES "warehouse_locations" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
