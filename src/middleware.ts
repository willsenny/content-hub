import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api");

  if (isApi) {
    const publicGet =
      req.method === "GET" &&
      (pathname === "/api/novels" || pathname.startsWith("/api/novels/"));

    if (publicGet) {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/novels", req.url));
    }
    return NextResponse.next();
  }

  const editorPath =
    pathname.startsWith("/novels/create") ||
    /^\/novels\/[^/]+\/edit$/.test(pathname) ||
    /^\/novels\/[^/]+\/chapters\/[^/]+\/edit$/.test(pathname);

  if (editorPath) {
    if (!token) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (token.role !== "AUTHOR" && token.role !== "ADMIN") {
      const url = new URL("/novels", req.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/novels/create/:path*", "/novels/:path*", "/api/:path*"],
};
