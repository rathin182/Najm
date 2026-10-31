import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const imageTypes = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", signature: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
};
const videoTypes = {
  "video/mp4": { extension: "mp4", signature: (bytes: Buffer) => bytes.toString("ascii", 4, 8) === "ftyp" },
  "video/quicktime": { extension: "mov", signature: (bytes: Buffer) => bytes.toString("ascii", 4, 8) === "ftyp" },
  "video/webm": { extension: "webm", signature: (bytes: Buffer) => bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
  "video/ogg": { extension: "ogv", signature: (bytes: Buffer) => bytes.toString("ascii", 0, 4) === "OggS" },
};

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const isVideo = file.type.startsWith("video/");
  const maxFileSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
  if (file.size === 0 || file.size > maxFileSize) {
    return Response.json({ error: isVideo ? "Video must be between 1 byte and 100 MB." : "Image must be between 1 byte and 10 MB." }, { status: 400 });
  }

  const mediaType = isVideo
    ? videoTypes[file.type as keyof typeof videoTypes]
    : imageTypes[file.type as keyof typeof imageTypes];
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!mediaType || !mediaType.signature(bytes)) {
    return Response.json({ error: "Use a valid JPEG, PNG, WebP, MP4, MOV, WebM or Ogg file." }, { status: 400 });
  }

  const filename = `${crypto.randomUUID()}.${mediaType.extension}`;
  const uploadDirectory = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(join(uploadDirectory, filename), bytes, { flag: "wx" });

  return Response.json({ url: `/uploads/${filename}`, kind: isVideo ? "video" : "image" });
}
