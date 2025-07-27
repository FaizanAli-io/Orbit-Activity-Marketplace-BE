/*
  Warnings:

  - The values [ADMIN] on the enum `AuthRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `Auth` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Auth` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessToken]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verificationToken]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordResetToken]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuthRole_new" AS ENUM ('USER', 'VENDOR', 'SUPERUSER');
ALTER TABLE "Auth" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Auth" ALTER COLUMN "role" TYPE "AuthRole_new" USING ("role"::text::"AuthRole_new");
ALTER TYPE "AuthRole" RENAME TO "AuthRole_old";
ALTER TYPE "AuthRole_new" RENAME TO "AuthRole";
DROP TYPE "AuthRole_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CASH';

-- AlterTable
ALTER TABLE "Auth" DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "role" DROP DEFAULT;

-- DropEnum
DROP TYPE "AuthStatus";

-- DropEnum
DROP TYPE "AuthType";

-- CreateIndex
CREATE UNIQUE INDEX "Auth_accessToken_key" ON "Auth"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_verificationToken_key" ON "Auth"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "Auth_passwordResetToken_key" ON "Auth"("passwordResetToken");
