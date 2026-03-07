import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const stripV2 = (pathname: string) => {
  if (pathname === "/v2") return "/";
  return pathname.replace(/^\/v2\//, "/");
};

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!pathname.startsWith("/v2")) {
    return NextResponse.next();
  }

  const targetPath = stripV2(pathname);
  const url = req.nextUrl.clone();
  url.pathname = targetPath;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/v2", "/v2/:path*"],
};
