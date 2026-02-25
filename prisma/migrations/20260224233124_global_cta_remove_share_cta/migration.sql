/*
  Warnings:

  - You are about to drop the column `cta_description` on the `Share` table. All the data in the column will be lost.
  - You are about to drop the column `cta_link` on the `Share` table. All the data in the column will be lost.
  - You are about to drop the column `cta_link_label` on the `Share` table. All the data in the column will be lost.
  - You are about to drop the column `cta_title` on the `Share` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Share" DROP COLUMN "cta_description",
DROP COLUMN "cta_link",
DROP COLUMN "cta_link_label",
DROP COLUMN "cta_title";

-- CreateTable
CREATE TABLE "GlobalCta" (
    "id" TEXT NOT NULL,
    "cta_title" TEXT,
    "cta_description" TEXT,
    "cta_link" TEXT,
    "cta_link_label" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalCta_pkey" PRIMARY KEY ("id")
);
