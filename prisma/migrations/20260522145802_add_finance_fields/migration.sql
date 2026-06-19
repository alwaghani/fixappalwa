-- AlterTable
ALTER TABLE "ServicePart" ADD COLUMN "hargaPokok" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServiceOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "merk" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "pin" TEXT,
    "problem" TEXT NOT NULL,
    "estimasiBiaya" INTEGER NOT NULL,
    "biayaFinal" INTEGER,
    "statusBayar" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "dpNominal" INTEGER,
    "lunasAt" DATETIME,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'diterima',
    "warrantyUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServiceOrder" ("catatan", "createdAt", "customerId", "estimasiBiaya", "id", "merk", "pin", "problem", "status", "tipe", "updatedAt", "warrantyUntil") SELECT "catatan", "createdAt", "customerId", "estimasiBiaya", "id", "merk", "pin", "problem", "status", "tipe", "updatedAt", "warrantyUntil" FROM "ServiceOrder";
DROP TABLE "ServiceOrder";
ALTER TABLE "new_ServiceOrder" RENAME TO "ServiceOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
