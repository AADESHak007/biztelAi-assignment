import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// ─── POST /api/uploads ───────────────────────────────────────────────────────
// Accept multipart/form-data with a `file` field.
// Uploads to Cloudinary, creates an Upload row, returns { uploadId, fileUrl }.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate allowed types
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
    if (!allowedMimes.includes(file.type)) {
      return Response.json(
        { error: `Unsupported file type: ${file.type}. Allowed: images and PDFs.` },
        { status: 415 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const cloudResult = await uploadToCloudinary(buffer, file.name, file.type);

    // Persist to DB
    const upload = await prisma.upload.create({
      data: {
        fileName: file.name,
        fileUrl:  cloudResult.secure_url,
        publicId: cloudResult.public_id,
        mimeType: file.type,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        status:   "processing",
      },
    });

    return Response.json({
      uploadId: upload.id,
      fileUrl:  upload.fileUrl,
      fileName: upload.fileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
    }, { status: 201 });

  } catch (error) {
    console.error("[POST /api/uploads]", error);
    return Response.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

// ─── GET /api/uploads ────────────────────────────────────────────────────────
// Returns upload history, most recent first.
// Query params: ?page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip  = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        orderBy: { uploadedAt: "desc" },
        skip,
        take: limit,
        include: {
          records: {
            select: {
              id: true,
              status: true,
              workOrderNum: true,
              shift: true,
              _count: { select: { validationErrors: true } },
            },
          },
        },
      }),
      prisma.upload.count(),
    ]);

    return Response.json({ uploads, total, page, limit });

  } catch (error) {
    console.error("[GET /api/uploads]", error);
    return Response.json({ error: "Failed to fetch uploads." }, { status: 500 });
  }
}
