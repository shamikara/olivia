import { google, drive_v3 } from "googleapis";
import { Readable } from "node:stream";
import type { MediaEnv } from "./env";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  md5Checksum: string | null;
  modifiedTime: string;
}

let cachedClient: { key: string; drive: drive_v3.Drive } | null = null;

function getDrive(env: MediaEnv): drive_v3.Drive {
  const key = `${env.googleServiceAccountEmail}:${env.googlePrivateKey}`;
  if (cachedClient?.key === key) return cachedClient.drive;

  const auth = new google.auth.JWT({
    email: env.googleServiceAccountEmail,
    key: env.googlePrivateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });
  cachedClient = { key, drive };
  return drive;
}

/** Escapes a value for use inside a Drive `q=` query string literal. */
function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolder(drive: drive_v3.Drive, name: string, parentId: string): Promise<string | null> {
  const res = await drive.files.list({
    q: `'${escapeQueryValue(parentId)}' in parents and name = '${escapeQueryValue(name)}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: "files(id, name)",
    spaces: "drive",
    pageSize: 1,
  });
  return res.data.files?.[0]?.id ?? null;
}

async function createFolder(drive: drive_v3.Drive, name: string, parentId: string): Promise<string> {
  const res = await drive.files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: "id",
  });
  if (!res.data.id) throw new Error("Drive did not return an id for the created folder");
  return res.data.id;
}

async function findOrCreateFolder(drive: drive_v3.Drive, name: string, parentId: string): Promise<string> {
  const existing = await findFolder(drive, name, parentId);
  if (existing) return existing;
  return createFolder(drive, name, parentId);
}

/** Products/{productId}/images, created on first use. */
export async function getOrCreateProductImagesFolder(env: MediaEnv, productId: string): Promise<string> {
  const drive = getDrive(env);
  const productFolder = await findOrCreateFolder(drive, productId, env.googleDriveRootFolderId);
  return findOrCreateFolder(drive, "images", productFolder);
}

/** One entry per product subfolder directly under the configured root. */
export async function listProductFolders(env: MediaEnv): Promise<Array<{ productId: string; folderId: string }>> {
  const drive = getDrive(env);
  const folders: Array<{ productId: string; folderId: string }> = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${escapeQueryValue(env.googleDriveRootFolderId)}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`,
      fields: "nextPageToken, files(id, name)",
      spaces: "drive",
      pageSize: 100,
      pageToken,
    });
    for (const file of res.data.files ?? []) {
      if (file.id && file.name) folders.push({ productId: file.name, folderId: file.id });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return folders;
}

/** Finds the "images" subfolder of a product folder, if it exists. */
export async function findImagesFolder(env: MediaEnv, productFolderId: string): Promise<string | null> {
  const drive = getDrive(env);
  return findFolder(drive, "images", productFolderId);
}

export async function listFilesInFolder(env: MediaEnv, folderId: string): Promise<DriveFileInfo[]> {
  const drive = getDrive(env);
  const files: DriveFileInfo[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${escapeQueryValue(folderId)}' in parents and mimeType != '${FOLDER_MIME}' and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, size, md5Checksum, modifiedTime)",
      spaces: "drive",
      pageSize: 100,
      pageToken,
    });
    for (const file of res.data.files ?? []) {
      if (!file.id || !file.name || !file.modifiedTime) continue;
      files.push({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType ?? "application/octet-stream",
        size: Number(file.size ?? 0),
        md5Checksum: file.md5Checksum ?? null,
        modifiedTime: file.modifiedTime,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return files;
}

export async function getFileInfo(env: MediaEnv, fileId: string): Promise<DriveFileInfo | null> {
  const drive = getDrive(env);
  try {
    const res = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, md5Checksum, modifiedTime, trashed",
    });
    if (!res.data.id || !res.data.name || !res.data.modifiedTime || res.data.trashed) return null;
    return {
      id: res.data.id,
      name: res.data.name,
      mimeType: res.data.mimeType ?? "application/octet-stream",
      size: Number(res.data.size ?? 0),
      md5Checksum: res.data.md5Checksum ?? null,
      modifiedTime: res.data.modifiedTime,
    };
  } catch (error) {
    const code = (error as { code?: number })?.code;
    if (code === 404) return null;
    throw error;
  }
}

export async function downloadFile(env: MediaEnv, fileId: string): Promise<Buffer> {
  const drive = getDrive(env);
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" },
  );
  return Buffer.from(res.data as ArrayBuffer);
}

/** Uploads a new original into a product's images folder. Returns Drive's own identity for it. */
export async function uploadOriginal(
  env: MediaEnv,
  folderId: string,
  filename: string,
  mimeType: string,
  buffer: Buffer,
): Promise<DriveFileInfo> {
  const drive = getDrive(env);
  const res = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: bufferToStream(buffer) },
    fields: "id, name, mimeType, size, md5Checksum, modifiedTime",
  });
  if (!res.data.id || !res.data.modifiedTime) throw new Error("Drive did not return an id for the uploaded file");
  return {
    id: res.data.id,
    name: res.data.name ?? filename,
    mimeType: res.data.mimeType ?? mimeType,
    size: Number(res.data.size ?? buffer.byteLength),
    md5Checksum: res.data.md5Checksum ?? null,
    modifiedTime: res.data.modifiedTime,
  };
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer);
}
