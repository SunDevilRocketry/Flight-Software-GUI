import { access, readFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_TYPES = {
  ".csv": "text/csv; charset=utf-8",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

export async function GET(_request, { params }) {
  const resolvedParams = await params;
  const segments = resolvedParams?.path ?? [];
  const resolvedPublicPath = path.resolve(process.cwd(), "../../public");
  const requestedPath = path.resolve(resolvedPublicPath, ...segments);

  if (!requestedPath.startsWith(resolvedPublicPath)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    await access(requestedPath);
    const fileBuffer = await readFile(requestedPath);
    const extension = path.extname(requestedPath).toLowerCase();
    const contentType =
      CONTENT_TYPES[extension] ?? "application/octet-stream";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
