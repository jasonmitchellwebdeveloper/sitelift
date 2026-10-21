import { NextResponse } from "next/server";
import { ImportError, publicImportError } from "@/lib/content/errors";
import { importContent } from "@/lib/content/import";
import { readBoundedJson } from "@/lib/content/read-json";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function POST(request: Request) {
  try {
    if (
      !/^application\/json(?:\s*;|$)/i.test(
        request.headers.get("content-type") ?? "",
      )
    ) {
      throw new ImportError("INVALID_REQUEST");
    }
    const input = await readBoundedJson(
      request,
      1024,
      "REQUEST_TOO_LARGE",
      "INVALID_REQUEST",
      AbortSignal.timeout(5_000),
    );
    const data = await importContent(input);
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const failure =
      error instanceof Error && error.name === "TimeoutError"
        ? new ImportError("REQUEST_TIMEOUT")
        : error;
    const { status, message } = publicImportError(failure);
    return NextResponse.json(
      { success: false, message },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
