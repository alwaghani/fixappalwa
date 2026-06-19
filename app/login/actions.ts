"use server"

import { headers } from "next/headers"
import { AuthError } from "next-auth"

import { signIn } from "@/auth"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
) {
  const headersList = await headers()
  const request = new Request("http://localhost", { headers: headersList })
  const { allowed } = rateLimitByIp(request, 5, 60_000)
  if (!allowed) {
    return "Terlalu banyak percobaan. Coba lagi dalam 1 menit."
  }

  try {
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const rawCallbackUrl = (formData.get("callbackUrl") as string) || "/dashboard"
    const callbackUrl = rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//") && !rawCallbackUrl.includes("://")
      ? rawCallbackUrl
      : "/dashboard"

    await signIn("credentials", { username, password, redirectTo: callbackUrl })
  } catch (error) {
    if (error instanceof AuthError) {
      return "Username atau password salah"
    }
    throw error
  }
}
