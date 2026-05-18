import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET /api/records/export ──────────────────────────────────────────────────
// Streams a CSV file of filtered records.
// Query params: ?status=&shift=&from=&to=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status")?.trim() ?? "";
    const shift  = searchParams.get("shift")?.trim().toUpperCase() ?? "";
    const from   = searchParams.get("from");
    const to     = searchParams.get("to");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (shift)  where.shift  = { equals: shift, mode: "insensitive" };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      };
    }

    const records = await prisma.record.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        upload: { select: { fileName: true, uploadedAt: true } },
        validationErrors: { select: { errorType: true, errorMessage: true } },
      },
    });

    // Build CSV
    const headers = [
      "ID",
      "File Name",
      "Date",
      "Shift",
      "Employee Number",
      "Operation Code",
      "Machine Number",
      "Work Order Number",
      "Quantity Produced",
      "Time Taken (hrs)",
      "Status",
      "Manual Notes",
      "Conf: Date",
      "Conf: Shift",
      "Conf: Employee",
      "Conf: OpCode",
      "Conf: Machine",
      "Conf: WorkOrder",
      "Conf: Quantity",
      "Conf: TimeTaken",
      "Validation Errors",
      "Uploaded At",
      "Created At",
    ];

    const escape = (v: unknown) => {
      const str = v == null ? "" : String(v);
      // Wrap in quotes if contains comma, newline, or double quote
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = records.map((r) => [
      r.id,
      r.upload?.fileName ?? "",
      r.date,
      r.shift,
      r.employeeNum,
      r.opCode,
      r.machineNum,
      r.workOrderNum,
      r.quantity ?? "",
      r.timeTaken ?? "",
      r.status,
      r.manualNotes ?? "",
      r.confDate.toFixed(2),
      r.confShift.toFixed(2),
      r.confEmployeeNum.toFixed(2),
      r.confOpCode.toFixed(2),
      r.confMachineNum.toFixed(2),
      r.confWorkOrderNum.toFixed(2),
      r.confQuantity.toFixed(2),
      r.confTimeTaken.toFixed(2),
      r.validationErrors.map((e) => e.errorMessage).join(" | "),
      r.upload?.uploadedAt?.toISOString() ?? "",
      r.createdAt.toISOString(),
    ].map(escape).join(","));

    const csv = [headers.join(","), ...rows].join("\n");

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename  = `biztelai-records-${timestamp}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("[GET /api/records/export]", error);
    return Response.json({ error: "Export failed." }, { status: 500 });
  }
}
