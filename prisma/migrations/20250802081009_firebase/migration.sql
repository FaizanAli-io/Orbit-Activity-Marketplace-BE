/*
  Warnings:

  - A unique constraint covering the columns `[firebaseId]` on the table `Auth` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Auth" ADD COLUMN     "firebaseId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Auth_firebaseId_key" ON "Auth"("firebaseId");
