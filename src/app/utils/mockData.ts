export interface ExtractedField<T> {
  value: T;
  confidence: number; // 0.0 to 1.0
}

export interface OperationalRecord {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  status: 'valid' | 'exception' | 'reviewed' | 'processing';
  fields: {
    date: ExtractedField<string>;
    shift: ExtractedField<string>;
    employeeNum: ExtractedField<string>;
    opCode: ExtractedField<string>;
    machineNum: ExtractedField<string>;
    workOrderNum: ExtractedField<string>;
    quantity: ExtractedField<number | string>;
    timeTaken: ExtractedField<number | string>;
  };
  validationErrors: string[];
  manualNotes?: string;
}

export const INITIAL_MOCK_RECORDS: OperationalRecord[] = [
  {
    id: "rec-1",
    fileName: "shift_log_2026-05-15_1.png",
    fileSize: "2.4 MB",
    uploadedAt: "2026-05-15T08:30:00Z",
    status: "valid",
    fields: {
      date: { value: "2026-05-15", confidence: 0.98 },
      shift: { value: "1", confidence: 0.95 },
      employeeNum: { value: "EMP-4022", confidence: 0.92 },
      opCode: { value: "OP-WELD", confidence: 0.89 },
      machineNum: { value: "MC-A1", confidence: 0.94 },
      workOrderNum: { value: "WO-88910", confidence: 0.97 },
      quantity: { value: 350, confidence: 0.91 },
      timeTaken: { value: 8, confidence: 0.96 }
    },
    validationErrors: []
  },
  {
    id: "rec-2",
    fileName: "handwritten_log_sheet_mc_b4.jpg",
    fileSize: "1.8 MB",
    uploadedAt: "2026-05-16T14:45:00Z",
    status: "exception",
    fields: {
      date: { value: "2026-05-16", confidence: 0.88 },
      shift: { value: "D", confidence: 0.42 }, // Exception: Invalid shift
      employeeNum: { value: "EMP-1082", confidence: 0.91 },
      opCode: { value: "OP-DRILL", confidence: 0.85 },
      machineNum: { value: "MC-B4", confidence: 0.90 },
      workOrderNum: { value: "WO-88911", confidence: 0.89 },
      quantity: { value: 0, confidence: 0.95 }, // Exception: Empty/zero quantity
      timeTaken: { value: 6.5, confidence: 0.87 }
    },
    validationErrors: [
      "Invalid shift value 'D'. Expected '1', '2', or '3'.",
      "Quantity produced cannot be zero or empty."
    ]
  },
  {
    id: "rec-3",
    fileName: "weld_station_3_may16.pdf",
    fileSize: "4.1 MB",
    uploadedAt: "2026-05-16T16:10:00Z",
    status: "exception",
    fields: {
      date: { value: "2026-05-16", confidence: 0.92 },
      shift: { value: "2", confidence: 0.91 },
      employeeNum: { value: "", confidence: 0.35 }, // Exception: Missing mandatory field
      opCode: { value: "OP-WELD", confidence: 0.80 },
      machineNum: { value: "MC-C3", confidence: 0.88 },
      workOrderNum: { value: "WO-88910", confidence: 0.95 }, // Exception: Duplicate work order
      quantity: { value: 1250, confidence: 0.48 }, // Low confidence & suspicious value
      timeTaken: { value: 24, confidence: 0.92 } // Exception: Suspicious time (> 12 hours)
    },
    validationErrors: [
      "Employee Number is a mandatory field.",
      "Duplicate Work Order Number 'WO-88910' already exists.",
      "Time Taken is suspiciously high (24 hours). Max recommended is 12 hours.",
      "Quantity produced is suspiciously high (1250 units)."
    ]
  },
  {
    id: "rec-4",
    fileName: "assembly_log_EMP-3044.png",
    fileSize: "1.2 MB",
    uploadedAt: "2026-05-17T09:15:00Z",
    status: "reviewed",
    fields: {
      date: { value: "2026-05-17", confidence: 0.99 },
      shift: { value: "3", confidence: 0.97 },
      employeeNum: { value: "EMP-3044", confidence: 0.98 },
      opCode: { value: "OP-ASSEM", confidence: 0.95 },
      machineNum: { value: "MC-A2", confidence: 0.96 },
      workOrderNum: { value: "WO-88915", confidence: 0.99 },
      quantity: { value: 210, confidence: 0.94 },
      timeTaken: { value: 8, confidence: 0.97 }
    },
    validationErrors: [],
    manualNotes: "Adjusted quantity from 210 to 215 as per shift supervisor verification."
  },
  {
    id: "rec-5",
    fileName: "paint_shop_card_17.jpg",
    fileSize: "3.1 MB",
    uploadedAt: "2026-05-17T11:20:00Z",
    status: "valid",
    fields: {
      date: { value: "2026-05-17", confidence: 0.94 },
      shift: { value: "2", confidence: 0.96 },
      employeeNum: { value: "EMP-9118", confidence: 0.91 },
      opCode: { value: "OP-PAINT", confidence: 0.93 },
      machineNum: { value: "MC-P1", confidence: 0.92 },
      workOrderNum: { value: "WO-88918", confidence: 0.85 },
      quantity: { value: 85, confidence: 0.89 },
      timeTaken: { value: 7.5, confidence: 0.90 }
    },
    validationErrors: []
  }
];
