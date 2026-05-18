import { OperationalRecord } from "./mockData";

export function validateRecord(
  record: Omit<OperationalRecord, "validationErrors" | "status">,
  existingRecords: OperationalRecord[]
): string[] {
  const errors: string[] = [];

  const { date, shift, employeeNum, opCode, machineNum, workOrderNum, quantity, timeTaken } = record.fields;

  // 1. Mandatory field checks
  if (!date.value || String(date.value).trim() === "") {
    errors.push("Date is a mandatory field.");
  }
  if (!shift.value || String(shift.value).trim() === "") {
    errors.push("Shift is a mandatory field.");
  }
  if (!employeeNum.value || String(employeeNum.value).trim() === "") {
    errors.push("Employee Number is a mandatory field.");
  }
  if (!machineNum.value || String(machineNum.value).trim() === "") {
    errors.push("Machine Number is a mandatory field.");
  }
  if (!workOrderNum.value || String(workOrderNum.value).trim() === "") {
    errors.push("Work Order Number is a mandatory field.");
  }

  // 2. Shift values validation
  const shiftVal = String(shift.value).trim().toUpperCase();
  if (shift.value && !["A", "B", "C"].includes(shiftVal)) {
    errors.push(`Invalid shift value '${shift.value}'. Expected 'A', 'B', or 'C'.`);
  }

  // 3. Machine code format validation (e.g., must contain a number and MC- prefix ideally, or MC)
  const machineVal = String(machineNum.value).trim().toUpperCase();
  if (machineNum.value && !machineVal.startsWith("MC")) {
    errors.push(`Incorrect machine code format '${machineNum.value}'. Machine codes should start with 'MC' (e.g. MC-A1, MC-10).`);
  }

  // 4. Quantity Produced validations
  const qtyVal = Number(quantity.value);
  if (quantity.value === "" || quantity.value === null || quantity.value === undefined) {
    errors.push("Quantity produced is a mandatory field.");
  } else if (isNaN(qtyVal)) {
    errors.push(`Quantity must be a valid number, got '${quantity.value}'.`);
  } else if (qtyVal <= 0) {
    errors.push("Quantity produced cannot be zero or negative.");
  } else if (qtyVal > 1000) {
    errors.push(`Quantity produced is suspiciously high (${qtyVal} units). Max limit is set to 1000 units per shift.`);
  }

  // 5. Time Taken validations (Hours)
  const timeVal = Number(timeTaken.value);
  if (timeTaken.value === "" || timeTaken.value === null || timeTaken.value === undefined) {
    errors.push("Time taken is a mandatory field.");
  } else if (isNaN(timeVal)) {
    errors.push(`Time taken must be a valid number, got '${timeTaken.value}'.`);
  } else if (timeVal <= 0) {
    errors.push("Time taken cannot be zero or negative.");
  } else if (timeVal > 12) {
    errors.push(`Time Taken is suspiciously high (${timeVal} hours). Max recommended is 12 hours.`);
  }

  // 6. Duplicate work order checks
  const currentWorkOrder = String(workOrderNum.value).trim().toUpperCase();
  if (workOrderNum.value && currentWorkOrder !== "") {
    const isDuplicate = existingRecords.some(
      (r) =>
        r.id !== record.id &&
        r.status !== "processing" &&
        String(r.fields.workOrderNum.value).trim().toUpperCase() === currentWorkOrder
    );
    if (isDuplicate) {
      errors.push(`Duplicate Work Order Number '${workOrderNum.value}' already exists in system history.`);
    }
  }

  return errors;
}
