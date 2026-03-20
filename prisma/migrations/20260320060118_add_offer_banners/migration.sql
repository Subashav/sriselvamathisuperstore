-- CreateTable
CREATE TABLE "public"."OfferBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "bgColor" TEXT NOT NULL DEFAULT '#fb923c',
    "textColor" TEXT NOT NULL DEFAULT '#151515',
    "link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferBanner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferBanner_isActive_sortOrder_idx" ON "public"."OfferBanner"("isActive", "sortOrder");

