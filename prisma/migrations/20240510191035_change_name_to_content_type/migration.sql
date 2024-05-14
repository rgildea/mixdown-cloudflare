/*
  Warnings:

  - You are about to drop the column `mimeType` on the `AudioFile` table. All the data in the column will be lost.
  - Added the required column `contentType` to the `AudioFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AudioFile" DROP COLUMN "mimeType",
ADD COLUMN     "contentType" TEXT NOT NULL,
ALTER COLUMN "trackVersionId" DROP NOT NULL;
