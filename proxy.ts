import { NextResponse } from "next/server"

import { auth } from "@/auth"

export const proxy = auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard(.*)",
    "/services(.*)",
    "/customers(.*)",
    "/keuangan(.*)",
    "/settings(.*)",
  ],
}
