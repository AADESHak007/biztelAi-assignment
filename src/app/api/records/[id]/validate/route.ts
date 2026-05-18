import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFields, persistValidationErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

// ─── POST /api/records/[id]/validate ─────────────────────────────────────────
// Re-runs all business validation rules against current field values in DB.
// Clears old errors, writes fresh ones, updates record status.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.record.findUnique({ where: { id } });
    if (!record) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    const errors = await validateFields({
      id:           record.id,
      date:         record.date,
      shift:        record.shift,
      employeeNum:  record.employeeNum,
      opCode:       record.opCode,
      machineNum:   record.machineNum,
      workOrderNum: record.workOrderNum,
      quantity:     record.quantity,
      timeTaken:    record.timeTaken,
    });

    const newStatus =
      errors.length > 0
        ? "exception"
        : record.status === "reviewed"
        ? "reviewed" // keep reviewed if already reviewed with no errors
        : "valid";

    await persistValidationErrors(id, errors);
    await prisma.record.update({ where: { id }, data: { status: newStatus } });

    return Response.json({
      recordId:  id,
      status:    newStatus,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("[POST /api/records/[id]/validate]", error);
    return Response.json({ error: "Validation failed." }, { status: 500 });
  }
}
