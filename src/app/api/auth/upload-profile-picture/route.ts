import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3011";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Menerima JSON (base64 image) dari frontend
    const body = await req.json();

    const headers = new Headers();
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Cookie", `token=${token}`);
    }
    req.headers.forEach((value, name) => {
      if (name.toLowerCase().startsWith("x-")) {
        headers.set(name, value);
      }
    });

    const destinationUrl = `${BACKEND_URL}/api/auth/upload-profile-picture`;

    const response = await fetch(destinationUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBuffer = await response.arrayBuffer();
    return new NextResponse(responseBuffer, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    console.error("[Upload Profile Picture Proxy] Error:", err.message);
    return NextResponse.json(
      { error: "Failed to connect to the server." },
      { status: 502 }
    );
  }
}
