// src/lib/proxyHelper.ts
import http from "http";
import { NextRequest, NextResponse } from "next/server";

export function proxyMultipartRequest(
  req: NextRequest,
  destinationUrl: string,
  customHeaders: Record<string, string>,
  bodyBuffer: Buffer
): Promise<NextResponse> {
  return new Promise((resolve) => {
    const url = new URL(destinationUrl);
    
    // Satukan headers asal dan custom headers
    const finalHeaders: Record<string, string> = { ...customHeaders };
    
    // Set content-length secara manual sesuai ukuran buffer asli
    finalHeaders["content-length"] = bodyBuffer.length.toString();

    const options: http.RequestOptions = {
      method: "POST",
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: finalHeaders,
    };

    const clientReq = http.request(options, (clientRes) => {
      const chunks: Buffer[] = [];
      clientRes.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      clientRes.on("end", () => {
        const responseBuffer = Buffer.concat(chunks);
        const resContentType = clientRes.headers["content-type"] || "";

        // Jika backend mengembalikan non-JSON (error HTML), buat respons error informatif
        if (!resContentType.includes("application/json")) {
          const text = responseBuffer.toString("utf8");
          console.error(`[Proxy Helper] Backend returned non-JSON for ${destinationUrl}:`, text.slice(0, 200));
          resolve(
            NextResponse.json(
              { ok: false, error: `Server error (HTTP ${clientRes.statusCode}): Please try again.` },
              { status: clientRes.statusCode || 500 }
            )
          );
          return;
        }

        try {
          const data = JSON.parse(responseBuffer.toString("utf8"));
          const response = NextResponse.json(data, { status: clientRes.statusCode || 200 });

          // Teruskan header Set-Cookie jika ada
          const setCookie = clientRes.headers["set-cookie"];
          if (setCookie) {
            if (Array.isArray(setCookie)) {
              setCookie.forEach((cookie) => response.headers.append("set-cookie", cookie));
            } else {
              response.headers.set("set-cookie", setCookie);
            }
          }
          resolve(response);
        } catch (parseErr: any) {
          console.error("[Proxy Helper] Failed to parse backend JSON response:", parseErr.message);
          resolve(
            NextResponse.json(
              { ok: false, error: "Invalid response format from backend server." },
              { status: 502 }
            )
          );
        }
      });
    });

    clientReq.on("error", (err) => {
      console.error(`[Proxy Helper] Request error for ${destinationUrl}:`, err.message);
      resolve(
        NextResponse.json(
          { ok: false, error: "Failed to connect to the backend server." },
          { status: 502 }
        )
      );
    });

    // Tulis buffer data secara langsung ke TCP socket
    clientReq.write(bodyBuffer);
    clientReq.end();
  });
}
