-- Items on sale are now managed in the database (Admin > Items & prices).
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "products_active_sortOrder_idx" ON "products"("active", "sortOrder");

-- Starting items (a Super Admin can rename, re-price, hide, add or delete them).
INSERT INTO "products" ("id", "label", "amount", "sortOrder", "updatedAt") VALUES
  ('prod_geo_tools', 'Geo Tools', 650.00, 1, CURRENT_TIMESTAMP),
  ('prod_compass_only', 'Compass only', 300.00, 2, CURRENT_TIMESTAMP),
  ('prod_tape_50m', '50m Tape', 250.00, 3, CURRENT_TIMESTAMP);
