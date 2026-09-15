import sharp from "sharp";

export const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

const MAX_DIMENSION = 12000;
const MIN_DIMENSION = 20;
const WEBP_QUALITY = 80;

const VARIANT_WIDTHS = { thumb: 400, medium: 900, large: 1600 } as const;
export type VariantSize = keyof typeof VARIANT_WIDTHS;

export interface ProcessedVariant {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

export interface ProcessedImage {
  width: number;
  height: number;
  variants: Record<VariantSize, ProcessedVariant>;
}

export class ImageValidationError extends Error {}

/**
 * Validates a downloaded/uploaded original and produces the WebP variants the
 * site actually needs. Never upscales past the source's own dimensions.
 */
export async function processImage(buffer: Buffer, mimeType: string): Promise<ProcessedImage> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ImageValidationError(`Unsupported image type: ${mimeType}`);
  }

  const source = sharp(buffer, { failOn: "error" });
  let metadata: sharp.Metadata;
  try {
    metadata = await source.metadata();
  } catch {
    throw new ImageValidationError("File is not a valid, decodable image");
  }

  const { width, height } = metadata;
  if (!width || !height) throw new ImageValidationError("Could not read image dimensions");
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new ImageValidationError(`Image dimensions too large (${width}x${height})`);
  }
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new ImageValidationError(`Image dimensions too small (${width}x${height})`);
  }

  const variants: Partial<Record<VariantSize, ProcessedVariant>> = {};
  for (const [name, targetWidth] of Object.entries(VARIANT_WIDTHS) as Array<[VariantSize, number]>) {
    const resized = sharp(buffer, { failOn: "error" })
      .rotate() // apply EXIF orientation before stripping metadata
      .resize({ width: targetWidth, withoutEnlargement: true, fit: "inside" })
      .webp({ quality: WEBP_QUALITY });
    const { data, info } = await resized.toBuffer({ resolveWithObject: true });
    variants[name] = { buffer: data, width: info.width, height: info.height, size: data.byteLength };
  }

  return { width, height, variants: variants as Record<VariantSize, ProcessedVariant> };
}
