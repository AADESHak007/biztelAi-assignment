import { prisma } from "./prisma";

export interface ValidationError {
  field: string;
  errorType: string;
  errorMessage: string;
}

interface RecordFields {
  id?: string; // existing record id (for duplicate check exclusion)
  date: string;
  shift: string;
  employeeNum: string;
  opCode: string;
  machineNum: string;
  workOrderNum: string;
  quantity: number | null | undefined;
  timeTaken: number | null | undefined;
}

export async function validateFields(
  fields: RecordFields
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // 1. Mandatory field checks
  if (!fields.date?.trim()) {
    errors.push({ field: "date", errorType: "MISSING_FIELD", errorMessage: "Date is a mandatory field." });
  }
  if (!fields.shift?.trim()) {
    errors.push({ field: "shift", errorType: "MISSING_FIELD", errorMessage: "Shift is a mandatory field." });
  }
  if (!fields.employeeNum?.trim()) {
    errors.push({ field: "employeeNum", errorType: "MISSING_FIELD", errorMessage: "Employee Number is a mandatory field." });
  }
  if (!fields.machineNum?.trim()) {
    errors.push({ field: "machineNum", errorType: "MISSING_FIELD", errorMessage: "Machine Number is a mandatory field." });
  }
  if (!fields.workOrderNum?.trim()) {
    errors.push({ field: "workOrderNum", errorType: "MISSING_FIELD", errorMessage: "Work Order Number is a mandatory field." });
  }

  // 2. Shift value validation (must be 1, 2, or 3)
  const shiftVal = fields.shift?.trim();
  if (shiftVal && !["1", "2", "3"].includes(shiftVal)) {
    errors.push({
      field: "shift",
      errorType: "INVALID_SHIFT",
      errorMessage: `Invalid shift value '${fields.shift}'. Expected '1', '2', or '3'.`,
    });
  }

  // 3. Machine code format validation (must start with 'MC')
  const mcVal = fields.machineNum?.trim().toUpperCase();
  if (mcVal && !mcVal.startsWith("MC")) {
    errors.push({
      field: "machineNum",
      errorType: "INVALID_FORMAT",
      errorMessage: `Incorrect machine code format '${fields.machineNum}'. Must start with 'MC' (e.g. MC-A1, MC-W2).`,
    });
  }

  // 4. Quantity validations
  if (fields.quantity === null || fields.quantity === undefined) {
    errors.push({ field: "quantity", errorType: "MISSING_FIELD", errorMessage: "Quantity produced is a mandatory field." });
  } else if (isNaN(Number(fields.quantity))) {
    errors.push({ field: "quantity", errorType: "INVALID_FORMAT", errorMessage: `Quantity must be a valid number, got '${fields.quantity}'.` });
  } else if (Number(fields.quantity) <= 0) {
    errors.push({ field: "quantity", errorType: "ZERO_QUANTITY", errorMessage: "Quantity produced cannot be zero or negative." });
  } else if (Number(fields.quantity) > 1000) {
    errors.push({
      field: "quantity",
      errorType: "SUSPICIOUS_VALUE",
      errorMessage: `Quantity is suspiciously high (${fields.quantity} units). Max limit per shift is 1000 units.`,
    });
  }

  // 5. Time taken validations
  if (fields.timeTaken === null || fields.timeTaken === undefined) {
    errors.push({ field: "timeTaken", errorType: "MISSING_FIELD", errorMessage: "Time taken is a mandatory field." });
  } else if (isNaN(Number(fields.timeTaken))) {
    errors.push({ field: "timeTaken", errorType: "INVALID_FORMAT", errorMessage: `Time taken must be a valid number, got '${fields.timeTaken}'.` });
  } else if (Number(fields.timeTaken) <= 0) {
    errors.push({ field: "timeTaken", errorType: "SUSPICIOUS_VALUE", errorMessage: "Time taken cannot be zero or negative." });
  } else if (Number(fields.timeTaken) > 12) {
    errors.push({
      field: "timeTaken",
      errorType: "SUSPICIOUS_VALUE",
      errorMessage: `Time taken is suspiciously high (${fields.timeTaken} hours). Maximum recommended is 12 hours per shift.`,
    });
  }

  // 6. Duplicate work order check (real DB query using candidate key: workOrderNum + shift + date)
  const woVal = fields.workOrderNum?.trim().toUpperCase();
  const dateVal = fields.date?.trim();

  if (woVal && shiftVal && dateVal) {
    const duplicate = await prisma.record.findFirst({
      where: {
        workOrderNum: { equals: woVal, mode: "insensitive" },
        shift:        { equals: shiftVal, mode: "insensitive" },
        date:         { equals: dateVal, mode: "insensitive" },
        ...(fields.id ? { NOT: { id: fields.id } } : {}),
      },
      select: { id: true },
    });
    if (duplicate) {
      errors.push({
        field: "workOrderNum",
        errorType: "DUPLICATE_WO",
        errorMessage: `Duplicate Entry Anomaly: Work Order '${fields.workOrderNum}' already has a registered log for Shift '${fields.shift}' on Date '${fields.date}'.`,
      });
    }
  }

  return errors;
}

/**
 * Persist validation errors to DB for a given record.
 * Clears existing errors first, then inserts fresh ones.
 */
export async function persistValidationErrors(
  recordId: string,
  errors: ValidationError[]
): Promise<void> {
  // Clear old errors
  await prisma.validationError.deleteMany({ where: { recordId } });

  if (errors.length === 0) return;

  await prisma.validationError.createMany({
    data: errors.map((e) => ({
      recordId,
      field:        e.field,
      errorType:    e.errorType,
      errorMessage: e.errorMessage,
    })),
  });
}
