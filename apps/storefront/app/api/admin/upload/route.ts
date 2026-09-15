import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { requireAdmin } from "../../../lib/admin-auth";
import { isMediaPipelineConfigured } from "../../../lib/media/env";
import { ingestAdminUpload } from "../../../lib/media/sync-service";
import type { ImageRole } from "../../../lib/media/types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "products");
const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/webp", ".webp"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/avif", ".avif"],
]);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "image";

// Maps the editor's field names to the pipeline's role vocabulary.
const ROLE_MAP: Record<string, Extract<ImageRole, "main" | "secondary">> = {
  image: "main",
  secondaryImage: "secondary",
};

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file supplied" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "File is empty" }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 20MB or smaller" }, { status: 413 });
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "Use a WebP, JPG, PNG or AVIF image" }, { status: 415 });
  }

  if (isMediaPipelineConfigured()) {
    const productId = form.get("productId")?.toString().trim();
    const role = ROLE_MAP[form.get("role")?.toString().trim() ?? ""];
    if (!productId || !role) {
      return NextResponse.json({ error: "Missing product id or image role for upload" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestAdminUpload(productId, role, buffer, file.type, file.name);
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: 502 });
    return NextResponse.json({ url: result.url }, { status: 201 });
  }

  // Local fallback when Drive/Supabase credentials aren't configured (e.g. local dev).
  // Timestamp suffix so re-uploading under the same name busts any cache.
  const fileName = `${slugify(form.get("name")?.toString() || file.name)}-${Date.now()}${extension}`;

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    const message =
      code === "EROFS" || code === "EACCES" || code === "EPERM"
        ? "Uploads need a writable disk or a blob store. This host's filesystem is read-only."
        : "Could not save the image";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ url: `/images/products/${fileName}` }, { status: 201 });
}
