

import { prisma } from '@/lib/db/prisma';
import { handleRouteError } from '@/lib/api/handle-route-error';
import { ok, fail } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guards';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const banners = await prisma.offerBanner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return ok(banners);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { title, description, imageUrl, bgColor, textColor, link } = body;

    if (!title || !imageUrl) {
      return fail('Title and imageUrl are required', 400);
    }

    const banner = await prisma.offerBanner.create({
      data: {
        title,
        description,
        imageUrl,
        bgColor: bgColor || '#f6de48',
        textColor: textColor || '#151515',
        link,
        isActive: true,
        sortOrder: 0,
      },
    });

    return ok(banner, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return fail('Banner ID is required', 400);
    }

    const banner = await prisma.offerBanner.update({
      where: { id },
      data: updateData,
    });

    return ok(banner);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return fail('Banner ID is required', 400);
    }

    await prisma.offerBanner.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
