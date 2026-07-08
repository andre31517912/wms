-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('RECEIVING', 'CORRECTION', 'DAMAGE', 'IMPORT', 'ORDER', 'ORDER_CANCELLED');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name_en" TEXT,
    "name_zh" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "sku" TEXT,
    "name_en" TEXT,
    "name_zh" TEXT,
    "detail_en" TEXT,
    "detail_zh" TEXT,
    "unit_weight_g" DOUBLE PRECISION,
    "pieces_per_case" INTEGER NOT NULL,
    "case_length_cm" DOUBLE PRECISION,
    "case_width_cm" DOUBLE PRECISION,
    "case_height_cm" DOUBLE PRECISION,
    "min_order_cases" INTEGER NOT NULL DEFAULT 1,
    "stock_cases" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT,
    "delta_cases" INTEGER NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "stock_adjustments_product_id_created_at_idx" ON "stock_adjustments"("product_id", "created_at");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Last line of defense against overselling: stock can never go negative
ALTER TABLE "products" ADD CONSTRAINT "products_stock_cases_non_negative" CHECK ("stock_cases" >= 0);
-- A product must have at least one name
ALTER TABLE "products" ADD CONSTRAINT "products_name_present" CHECK ("name_en" IS NOT NULL OR "name_zh" IS NOT NULL);
-- Same for categories
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_present" CHECK ("name_en" IS NOT NULL OR "name_zh" IS NOT NULL);
