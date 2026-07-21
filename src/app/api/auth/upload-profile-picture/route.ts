// src/app/api/auth/upload-profile-picture/route.ts
// Next.js API Route — proxies multipart upload ke backend Express.
// Menggantikan next.config.ts rewrite yang tidak reliable untuk multipart/form-data.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

export async function POST(req: NextRequest) {
  try {
    // Ambil auth cookie dan teruskan ke backend
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Baca form data dari request asli
    const formData = await req.formData();

    // Buat header — teruskan cookie auth
    const headers: HeadersInit = {};
    if (token) {
      headers["Cookie"] = `token=${token}`;
    }

    // Forward ke backend Express
    const backendRes = await fetch(
      `${BACKEND_URL}/api/auth/upload-profile-picture`,
      {
        method: "POST",
        headers,
        body: formData,
      }
    );

    const contentType = backendRes.headers.get("content-type") || "";

    // Jika backend mengembalikan HTML (error), beri JSON error yang informatif
    if (!contentType.includes("application/json")) {
      const text = await backendRes.text();
      console.error("[Upload Proxy] Backend returned non-JSON:", text.slice(0, 200));
      return NextResponse.json(
        { error: `Backend error (HTTP ${backendRes.status}): Mohon coba lagi.` },
        { status: backendRes.status }
      );
    }

    const data = await backendRes.json();

    // Teruskan Set-Cookie dari backend (refresh token) ke browser
    const response = NextResponse.json(data, { status: backendRes.status });
    const setCookie = backendRes.headers.get("set-cookie");
    if (setCookie) {
      response.headers.set("set-cookie", setCookie);
    }

    return response;
  } catch (err: any) {
    console.error("[Upload Proxy] Error:", err.message);
    return NextResponse.json(
      { error: "Gagal terhubung ke backend. Pastikan server berjalan." },
      { status: 502 }
    );
  }
}
