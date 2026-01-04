import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    message: string;
    code?: string;
  };
};

export function jsonError(status: number, message: string, code?: string) {
  const body: ApiErrorBody = { error: { message, code } };
  return NextResponse.json(body, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}


