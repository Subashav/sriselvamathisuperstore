-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('TEXT', 'IMAGE');

-- AlterTable
ALTER TABLE "OfferBanner"
  ADD COLUMN "type" "BannerType" NOT NULL DEFAULT 'IMAGE',
  ALTER COLUMN "imageUrl" DROP NOT NULL;
