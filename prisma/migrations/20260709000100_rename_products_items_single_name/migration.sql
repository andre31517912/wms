-- Hand-written rename migration (preserves data):
--   categories -> products   (the grouping)
--   products   -> items      (the orderable SKU)
--   bilingual name_en/name_zh merged into a single "name" (Chinese preferred),
--   detail_en/detail_zh merged into "detail"

-- 1) old "products" becomes "items" (do this first to free up the name)
ALTER TABLE "products" RENAME TO "items";
ALTER INDEX "products_pkey" RENAME TO "items_pkey";
ALTER INDEX "products_category_id_idx" RENAME TO "items_product_id_idx";
ALTER INDEX "products_sku_idx" RENAME TO "items_sku_idx";
ALTER TABLE "items" RENAME CONSTRAINT "products_category_id_fkey" TO "items_product_id_fkey";
ALTER TABLE "items" RENAME CONSTRAINT "products_stock_cases_non_negative" TO "items_stock_cases_non_negative";
ALTER TABLE "items" DROP CONSTRAINT "products_name_present";
ALTER TABLE "items" RENAME COLUMN "category_id" TO "product_id";

-- merge bilingual fields on items
ALTER TABLE "items" ADD COLUMN "name" TEXT;
UPDATE "items" SET "name" = COALESCE("name_zh", "name_en");
ALTER TABLE "items" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "items" ADD COLUMN "detail" TEXT;
UPDATE "items" SET "detail" = COALESCE("detail_zh", "detail_en");
ALTER TABLE "items" DROP COLUMN "name_en";
ALTER TABLE "items" DROP COLUMN "name_zh";
ALTER TABLE "items" DROP COLUMN "detail_en";
ALTER TABLE "items" DROP COLUMN "detail_zh";

-- 2) "categories" becomes "products"
ALTER TABLE "categories" RENAME TO "products";
ALTER INDEX "categories_pkey" RENAME TO "products_pkey";
ALTER TABLE "products" DROP CONSTRAINT "categories_name_present";
ALTER TABLE "products" ADD COLUMN "name" TEXT;
UPDATE "products" SET "name" = COALESCE("name_zh", "name_en");
ALTER TABLE "products" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "products" DROP COLUMN "name_en";
ALTER TABLE "products" DROP COLUMN "name_zh";

-- 3) stock_adjustments now references items
ALTER TABLE "stock_adjustments" RENAME COLUMN "product_id" TO "item_id";
ALTER INDEX "stock_adjustments_product_id_created_at_idx" RENAME TO "stock_adjustments_item_id_created_at_idx";
ALTER TABLE "stock_adjustments" RENAME CONSTRAINT "stock_adjustments_product_id_fkey" TO "stock_adjustments_item_id_fkey";
