import { NextResponse } from "next/server";

export const ok = <T>(data: T, status = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

export const fail = (message: string, status = 400, details?: unknown) => {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details,
      },
    },
    { status },
  );
};
