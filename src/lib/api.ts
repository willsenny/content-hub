import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

import { authOptions } from "@/lib/auth";

export function ok<T>(data: T) {
  return NextResponse.json({ success: true, data });
}

export function fail(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function requireRole(role: Role) {
  return {
    code: 403,
    message: "权限不足",
    expected: role,
  };
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export function isAdmin(user: { role: Role } | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("pageSize")) || 20),
  );
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}
