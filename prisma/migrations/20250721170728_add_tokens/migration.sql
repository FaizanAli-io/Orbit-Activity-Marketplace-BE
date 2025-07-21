/*
  Warnings:

  - You are about to drop the column `token` on the `Auth` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Auth" DROP COLUMN "token",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "verificationToken" TEXT;
