import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateFields, persistValidationErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

// ─── GET /api/records/[id] ───────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        upload: true,
        validationErrors: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!record) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    return Response.json(record);
  } catch (error) {
    console.error("[GET /api/records/[id]]", error);
    return Response.json({ error: "Failed to fetch record." }, { status: 500 });
  }
}

// ─── PATCH /api/records/[id] ─────────────────────────────────────────────────
// Body: partial record fields + optional manualNotes
// Saves corrections, re-runs validation, updates status.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.record.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    // Merge incoming fields over existing values
    const updatedFields = {
      date:         body.date         ?? existing.date,
      shift:        body.shift        ?? existing.shift,
      employeeNum:  body.employeeNum  ?? existing.employeeNum,
      opCode:       body.opCode       ?? existing.opCode,
      machineNum:   body.machineNum   ?? existing.machineNum,
      workOrderNum: body.workOrderNum ?? existing.workOrderNum,
      quantity:     body.quantity  !== undefined ? (body.quantity  === "" ? null : Number(body.quantity))  : existing.quantity,
      timeTaken:    body.timeTaken !== undefined ? (body.timeTaken === "" ? null : Number(body.timeTaken)) : existing.timeTaken,
      manualNotes:  body.manualNotes  !== undefined ? body.manualNotes : existing.manualNotes,
    };

    // Re-run validation
    const errors = await validateFields({ id, ...updatedFields });
    const newStatus = errors.length > 0 ? "exception" : "reviewed";

    // Persist updated record
    const updated = await prisma.record.update({
      where: { id },
      data: {
        ...updatedFields,
        status:     newStatus,
        reviewedAt: new Date(),
      },
      include: {
        upload: true,
        validationErrors: true,
      },
    });

    // Persist fresh validation errors
    await persistValidationErrors(id, errors);

    // Refetch with fresh errors
    const fullRecord = await prisma.record.findUnique({
      where: { id },
      include: { upload: true, validationErrors: true },
    });

    return Response.json(fullRecord);
  } catch (error) {
    console.error("[PATCH /api/records/[id]]", error);
    return Response.json({ error: "Failed to update record." }, { status: 500 });
  }
}

// ─── DELETE /api/records/[id] ────────────────────────────────────────────────
// Soft delete: marks status as 'deleted' (keeps upload row).
// Hard delete option: pass ?hard=true to also remove from Cloudinary.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await prisma.record.findUnique({
      where: { id },
      include: { upload: true },
    });
    if (!record) {
      return Response.json({ error: "Record not found" }, { status: 404 });
    }

    // Cascade delete (validationErrors cascade via schema)
    await prisma.record.delete({ where: { id } });

    // Check if there are other sibling records belonging to this upload
    const remaining = await prisma.record.count({ where: { uploadId: record.uploadId } });
    if (remaining === 0) {
      await prisma.upload.delete({ where: { id: record.uploadId } });
    }

    return Response.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("[DELETE /api/records/[id]]", error);
    return Response.json({ error: "Failed to delete record." }, { status: 500 });
  }
}
