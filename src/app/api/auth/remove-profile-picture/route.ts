// src/app/api/auth/remove-profile-picture/route.ts
// Next.js API Route — proxies remove-profile-picture ke backend Express.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) {
      headers["Cookie"] = `token=${token}`;
    }

    const backendRes = await fetch(
      `${BACKEND_URL}/api/auth/remove-profile-picture`,
      {
        method: "POST",
        headers,
      }
    );

    const contentType = backendRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await backendRes.text();
      console.error("[Remove-Picture Proxy] Backend returned non-JSON:", text.slice(0, 200));
      return NextResponse.json(
        { error: `Backend error (HTTP ${backendRes.status}): Mohon coba lagi.` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();
    const response = NextResponse.json(data, { status: backendRes.status });

    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err: any) {
    console.error("[Remove-Picture Proxy] Error:", err.message);
    return NextResponse.json(
      { error: "Gagal terhubung ke backend. Pastikan server berjalan." },
      { status: 502 }
    );
  }
}
