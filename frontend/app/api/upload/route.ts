import { NextRequest, NextResponse } from "next/server";

// Increase max duration for large file uploads (embedding can take 30-60s)
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Forward directly to backend – preserve multipart boundary
    const res = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      headers: {
        // Forward auth if present
        ...(req.headers.get("authorization")
          ? { Authorization: req.headers.get("authorization")! }
          : {}),
        // Do NOT set Content-Type — fetch sets it with the correct boundary automatically
      },
      body: formData,
      signal: AbortSignal.timeout(110_000), // 110s timeout
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("[upload route] error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
