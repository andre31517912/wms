-- Drop the global unique constraint on batch_number
DROP INDEX "batches_batch_number_key";

-- Renumber existing batches per-item (ordered by imported_at)
WITH numbered AS (
  SELECT id, item_id,
         'B-' || LPAD(ROW_NUMBER() OVER (PARTITION BY item_id ORDER BY imported_at)::text, 5, '0') AS new_number
  FROM batches
)
UPDATE batches SET batch_number = numbered.new_number
FROM numbered WHERE batches.id = numbered.id;

-- Add composite unique constraint (item_id, batch_number)
CREATE UNIQUE INDEX "batches_item_id_batch_number_key" ON "batches"("item_id", "batch_number");

-- Drop the global sequence (no longer needed)
DROP SEQUENCE IF EXISTS batch_number_seq;
