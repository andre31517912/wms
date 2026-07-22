-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "initial_cases" INTEGER NOT NULL,
    "remaining_cases" INTEGER NOT NULL,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "note" TEXT,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_allocations" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "order_line_id" TEXT NOT NULL,
    "qty_cases" INTEGER NOT NULL,

    CONSTRAINT "batch_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batches_batch_number_key" ON "batches"("batch_number");

-- CreateIndex
CREATE INDEX "batches_item_id_imported_at_idx" ON "batches"("item_id", "imported_at");

-- CreateIndex
CREATE INDEX "batch_allocations_batch_id_idx" ON "batch_allocations"("batch_id");

-- CreateIndex
CREATE INDEX "batch_allocations_order_line_id_idx" ON "batch_allocations"("order_line_id");

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_allocations" ADD CONSTRAINT "batch_allocations_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_allocations" ADD CONSTRAINT "batch_allocations_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "order_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Batch number sequence (B-00001, B-00002, ...)
CREATE SEQUENCE IF NOT EXISTS batch_number_seq START 1;

-- Remaining cases must be non-negative
ALTER TABLE "batches" ADD CONSTRAINT "batches_remaining_non_negative" CHECK ("remaining_cases" >= 0);

-- Seed legacy batches for items that already have stock
INSERT INTO "batches" ("id", "batch_number", "item_id", "initial_cases", "remaining_cases", "note")
SELECT
    gen_random_uuid()::text,
    'B-' || LPAD(nextval('batch_number_seq')::text, 5, '0'),
    id,
    stock_cases,
    stock_cases,
    'Legacy stock (pre-batch-tracking)'
FROM items
WHERE stock_cases > 0;
