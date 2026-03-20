

import { prisma } from '@/lib/db/prisma';
import { handleRouteError } from '@/lib/api/handle-route-error';
import { ok, fail } from '@/lib/api/response';
import { requireAdmin } from '@/lib/auth/guards';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

async function requireAdminInProduction(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  await requireAdmin(request);
}

export async function GET(request: NextRequest) {
  try {
    const typeParam = request.nextUrl.searchParams.get('type');
    const type = typeParam === 'TEXT' || typeParam === 'IMAGE' ? typeParam : undefined;

    const banners = await prisma.offerBanner.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });

    return ok(banners);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminInProduction(request);

    const body = await request.json();
    const { title, description, imageUrl, bgColor, textColor, link, type } = body;
    const normalizedType = type === 'TEXT' || type === 'IMAGE' ? type : 'TEXT';

    if (!title) {
      return fail('Title is required', 400);
    }

    if (normalizedType === 'IMAGE' && !imageUrl) {
      return fail('imageUrl is required for image banners', 400);
    }

    const banner = await prisma.offerBanner.create({
      data: {
        type: normalizedType,
        title,
        description,
        imageUrl: normalizedType === 'IMAGE' ? imageUrl : null,
        bgColor: bgColor || '#fb923c',
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
    await requireAdminInProduction(request);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return fail('Banner ID is required', 400);
    }

    const normalizedType =
      updateData.type === 'TEXT' || updateData.type === 'IMAGE'
        ? updateData.type
        : undefined;

    if (normalizedType === 'TEXT') {
      updateData.imageUrl = null;
    }

    if (normalizedType === 'IMAGE' && !updateData.imageUrl) {
      return fail('imageUrl is required for image banners', 400);
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
    await requireAdminInProduction(request);

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

