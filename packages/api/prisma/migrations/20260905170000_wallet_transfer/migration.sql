CREATE TABLE "WalletTransfer" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sourceWalletId" TEXT NOT NULL,
  "destinationWalletId" TEXT NOT NULL,
  "amount" DECIMAL(19,2) NOT NULL,
  "transferDate" DATE NOT NULL,
  "note" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WalletTransfer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WalletTransfer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WalletTransfer_sourceWalletId_fkey" FOREIGN KEY ("sourceWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WalletTransfer_destinationWalletId_fkey" FOREIGN KEY ("destinationWalletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "WalletTransfer_userId_transferDate_idx" ON "WalletTransfer"("userId", "transferDate");
CREATE INDEX "WalletTransfer_sourceWalletId_transferDate_idx" ON "WalletTransfer"("sourceWalletId", "transferDate");
CREATE INDEX "WalletTransfer_destinationWalletId_transferDate_idx" ON "WalletTransfer"("destinationWalletId", "transferDate");
