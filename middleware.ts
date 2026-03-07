import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function stripV2(pathname: string) {
  if (!pathname.startsWith("/v2")) {
    return pathname;
  }
  if (pathname === "/v2") return "/";
  return pathname.replace(/^\/v2\//, "/");
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  if (!url.pathname.startsWith("/v2")) {
    return NextResponse.next();
  }

  url.pathname = stripV2(url.pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
