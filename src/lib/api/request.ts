import { NextRequest } from "next/server";
import { AppError } from "@/lib/api/errors";

export const parseJson = async <T>(request: NextRequest): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError("Invalid JSON payload", 400);
  }
};

export const parseNumber = (value: string | null | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
