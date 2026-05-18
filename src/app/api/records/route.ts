import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET /api/records ─────────────────────────────────────────────────────────
// Query params: ?search=&status=&shift=&from=&to=&page=1&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";
    const shift  = searchParams.get("shift")?.trim().toUpperCase() ?? "";
    const from   = searchParams.get("from");
    const to     = searchParams.get("to");
    const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const skip   = (page - 1) * limit;

    // Build WHERE clause dynamically
    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (shift)  where.shift  = { equals: shift, mode: "insensitive" };

    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      };
    }

    if (search) {
      where.OR = [
        { workOrderNum: { contains: search, mode: "insensitive" } },
        { employeeNum:  { contains: search, mode: "insensitive" } },
        { machineNum:   { contains: search, mode: "insensitive" } },
        { opCode:       { contains: search, mode: "insensitive" } },
        { upload: { fileName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          upload: { select: { fileName: true, fileUrl: true, fileSize: true, mimeType: true, uploadedAt: true } },
          validationErrors: true,
        },
      }),
      prisma.record.count({ where }),
    ]);

    return Response.json({ records, total, page, limit });

  } catch (error) {
    console.error("[GET /api/records]", error);
    return Response.json({ error: "Failed to fetch records." }, { status: 500 });
  }
}
