/*
  Warnings:

  - You are about to drop the column `profileDesc` on the `Vendor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Auth" DROP CONSTRAINT "Auth_userId_fkey";

-- DropForeignKey
ALTER TABLE "Auth" DROP CONSTRAINT "Auth_vendorId_fkey";

-- AlterTable
ALTER TABLE "Vendor" DROP COLUMN "profileDesc",
ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auth" ADD CONSTRAINT "Auth_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
