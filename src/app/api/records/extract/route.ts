import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractWithGemini } from "@/lib/gemini";
import { validateFields, persistValidationErrors } from "@/lib/validation";

export const dynamic = "force-dynamic";

// ─── POST /api/records/extract ───────────────────────────────────────────────
// Body: { uploadId: string }
// Runs Gemini extraction on the stored file, persists to DB, runs validation.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId } = body as { uploadId?: string };

    if (!uploadId) {
      return Response.json({ error: "uploadId is required" }, { status: 400 });
    }

    // Fetch the upload record
    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
    if (!upload) {
      return Response.json({ error: "Upload not found" }, { status: 404 });
    }

    // Check if extraction already ran for this upload
    const existing = await prisma.record.findFirst({ where: { uploadId } });
    if (existing) {
      return Response.json({ error: "Record already extracted for this upload.", recordId: existing.id }, { status: 409 });
    }

    // ── Run Gemini extraction ──
    let extractedList;
    try {
      extractedList = await extractWithGemini(upload.fileUrl, upload.mimeType);
    } catch (aiError) {
      // Mark upload as failed
      await prisma.upload.update({ where: { id: uploadId }, data: { status: "failed" } });
      console.error("[Gemini extraction failed]", aiError);
      return Response.json({ error: "AI extraction failed. Check your GEMINI_API_KEY and try again." }, { status: 502 });
    }

    // ── Persist extracted batch records ──
    const createdRecords = [];
    for (const extracted of extractedList) {
      const record = await prisma.record.create({
        data: {
          uploadId,
          date:          String(extracted.date.value ?? ""),
          shift:         String(extracted.shift.value ?? ""),
          employeeNum:   String(extracted.employeeNum.value ?? ""),
          opCode:        String(extracted.opCode.value ?? ""),
          machineNum:    String(extracted.machineNum.value ?? ""),
          workOrderNum:  String(extracted.workOrderNum.value ?? ""),
          quantity:      extracted.quantity.value  != null ? Number(extracted.quantity.value)  : null,
          timeTaken:     extracted.timeTaken.value != null ? Number(extracted.timeTaken.value) : null,
          confDate:         extracted.date.confidence,
          confShift:        extracted.shift.confidence,
          confEmployeeNum:  extracted.employeeNum.confidence,
          confOpCode:       extracted.opCode.confidence,
          confMachineNum:   extracted.machineNum.confidence,
          confWorkOrderNum: extracted.workOrderNum.confidence,
          confQuantity:     extracted.quantity.confidence,
          confTimeTaken:    extracted.timeTaken.confidence,
          status: "valid",
        },
      });

      // ── Run validation rules for each record ──
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

      const finalStatus = errors.length > 0 ? "exception" : "valid";

      // ── Persist validation errors and update status ──
      await persistValidationErrors(record.id, errors);
      const updatedRecord = await prisma.record.update({
        where: { id: record.id },
        data: { status: finalStatus },
        include: { upload: true, validationErrors: true },
      });

      createdRecords.push(updatedRecord);
    }

    await prisma.upload.update({ where: { id: uploadId }, data: { status: "done" } });

    // Return the first record in the batch for frontend selection compatibility,
    // or return the batch (frontend can handle first element or array gracefully)
    return Response.json(createdRecords[0] || null, { status: 201 });

  } catch (error) {
    console.error("[POST /api/records/extract]", error);
    return Response.json({ error: "Extraction pipeline failed." }, { status: 500 });
  }
}
