import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── GET /api/dashboard/stats ─────────────────────────────────────────────────
// Returns all aggregated analytics in a single response.
// Used by the Dashboard page to populate KPI cards and charts.
export async function GET() {
  try {
    // Run all aggregations in parallel for performance
    const [
      totalUploads,
      statusCounts,
      shiftAgg,
      machineAgg,
      errorTypeAgg,
      confAgg,
      totalQuantity,
      recentExceptions,
    ] = await Promise.all([

      // 1. Total uploads
      prisma.upload.count(),

      // 2. Record counts by status
      prisma.record.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // 3. Shift-wise: total quantity and record count
      prisma.record.groupBy({
        by: ["shift"],
        _sum:   { quantity: true },
        _count: { id: true },
        orderBy: { shift: "asc" },
      }),

      // 4. Machine-wise: top 5 by total quantity
      prisma.record.groupBy({
        by: ["machineNum"],
        _sum:   { quantity: true, timeTaken: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
        where: { machineNum: { not: "" } },
      }),

      // 5. Validation error types breakdown
      prisma.validationError.groupBy({
        by: ["errorType"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),

      // 6. Average confidence across all confidence columns
      prisma.record.aggregate({
        _avg: {
          confDate:         true,
          confShift:        true,
          confEmployeeNum:  true,
          confOpCode:       true,
          confMachineNum:   true,
          confWorkOrderNum: true,
          confQuantity:     true,
          confTimeTaken:    true,
        },
      }),

      // 7. Total quantity produced (all records)
      prisma.record.aggregate({
        _sum: { quantity: true },
      }),

      // 8. Recent exceptions (latest 4) for the action hub
      prisma.record.findMany({
        where:   { status: "exception" },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          upload:          { select: { fileName: true, fileUrl: true, uploadedAt: true } },
          validationErrors: true,
        },
      }),
    ]);

    // ── Compute derived stats ──

    // Status breakdown as a map
    const statusMap: Record<string, number> = {};
    statusCounts.forEach((s) => { statusMap[s.status] = s._count.id; });

    const totalRecords  = Object.values(statusMap).reduce((a, b) => a + b, 0);
    const exceptionCount = statusMap["exception"] ?? 0;
    const validCount     = statusMap["valid"]     ?? 0;
    const reviewedCount  = statusMap["reviewed"]  ?? 0;
    const exceptionRate  = totalRecords > 0 ? Math.round((exceptionCount / totalRecords) * 100) : 0;

    // Average confidence (mean of all 8 field averages)
    const avgVals = Object.values(confAgg._avg).filter(Boolean) as number[];
    const avgConfidence = avgVals.length > 0
      ? Math.round((avgVals.reduce((a, b) => a + b, 0) / avgVals.length) * 100)
      : 0;

    // Shift data formatted for charts
    const shiftData = shiftAgg.map((s) => ({
      shift:    s.shift || "?",
      quantity: s._sum.quantity ?? 0,
      count:    s._count.id,
    }));

    // Machine data formatted for charts
    const machineData = machineAgg.map((m) => ({
      machine:  m.machineNum,
      quantity: m._sum.quantity ?? 0,
      hours:    m._sum.timeTaken ?? 0,
      count:    m._count.id,
    }));

    // Error type breakdown
    const errorBreakdown = errorTypeAgg.map((e) => ({
      type:  e.errorType,
      count: e._count.id,
    }));

    return Response.json({
      totalUploads,
      totalRecords,
      exceptionCount,
      validCount,
      reviewedCount,
      exceptionRate,
      avgConfidence,
      totalQuantity: totalQuantity._sum.quantity ?? 0,
      shiftData,
      machineData,
      errorBreakdown,
      recentExceptions,
    });

  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error);
    return Response.json({ error: "Failed to compute dashboard stats." }, { status: 500 });
  }
}
