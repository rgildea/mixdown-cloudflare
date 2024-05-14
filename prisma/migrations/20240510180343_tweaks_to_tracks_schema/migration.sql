/*
  Warnings:

  - A unique constraint covering the columns `[id,version]` on the table `TrackVersion` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TrackVersion" ADD COLUMN     "version" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TrackVersion_id_version_key" ON "TrackVersion"("id", "version");
