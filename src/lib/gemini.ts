import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `
You are an expert AI extraction agent for industrial manufacturing logs and operational records.
Analyze the uploaded handwritten, typed, or semi-structured document and extract operational data.
Return ONLY a valid JSON object. No markdown, no explanation, no extra text.

Each field must be an object with "value" and "confidence" (0.0–1.0).
Confidence reflects how legible and certain you are of that specific value.

{
  "date":         { "value": "YYYY-MM-DD", "confidence": 0.95 },
  "shift":        { "value": "1",          "confidence": 0.90 },
  "employeeNum":  { "value": "EMP-XXXX",   "confidence": 0.85 },
  "opCode":       { "value": "OP-XXXX",    "confidence": 0.80 },
  "machineNum":   { "value": "MC-XXXX",    "confidence": 0.92 },
  "workOrderNum": { "value": "WO-XXXXX",   "confidence": 0.97 },
  "quantity":     { "value": 150,          "confidence": 0.88 },
  "timeTaken":    { "value": 8.0,          "confidence": 0.94 }
}

Rules:
- shift must be "1", "2", or "3" — if unclear extract whatever you see
- quantity and timeTaken are numbers — use null if completely unreadable
- If a field is blank or missing in the document, use "" for strings, null for numbers, and confidence 0.0
`.trim();

interface ExtractionResult {
  date:         { value: string; confidence: number };
  shift:        { value: string; confidence: number };
  employeeNum:  { value: string; confidence: number };
  opCode:       { value: string; confidence: number };
  machineNum:   { value: string; confidence: number };
  workOrderNum: { value: string; confidence: number };
  quantity:     { value: number | null; confidence: number };
  timeTaken:    { value: number | null; confidence: number };
}

export async function extractWithGemini(
  fileUrl: string,
  mimeType: string
): Promise<ExtractionResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  // 1. Fetch file from Cloudinary and convert to base64
  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    throw new Error(`Failed to fetch file from storage: ${fileResponse.status}`);
  }
  const arrayBuffer = await fileResponse.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  // 2. Initialize Gemini client using the official GoogleGenerativeAI SDK
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Low temp for highly deterministic extraction
    },
  });

  // 3. Request generation from model passing prompt and inline base64 media
  const result = await model.generateContent([
    SYSTEM_PROMPT,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType === "application/pdf" ? "application/pdf" : mimeType,
      },
    },
  ]);

  const rawText = result.response.text().trim();
  console.log("=== GEMINI OCR EXTRACTOR START ===");
  console.log("Raw Response Text:\n", rawText);

  // Strip any accidental markdown formatting if present
  const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  console.log("Parsed JSON Object:\n", JSON.stringify(parsed, null, 2));

  // Get raw items (ensuring it is treated as an array of items)
  const items = Array.isArray(parsed) ? parsed : [parsed];

  // Safe defaults mapping — handles both nested objects and direct flat values
  const safe = (field: unknown, defaultVal: any = "") => {
    if (field === undefined || field === null) {
      return { value: defaultVal, confidence: 0 };
    }
    if (typeof field === "object") {
      const f = field as Record<string, unknown>;
      return {
        value:      f.value !== undefined && f.value !== null ? f.value : defaultVal,
        confidence: typeof f.confidence === "number" ? f.confidence : 0.90,
      };
    }
    // Direct flat value fallback
    return {
      value:      field,
      confidence: 0.90,
    };
  };

  const finalResults = items.map((dataObject: any) => ({
    date:         safe(dataObject.date) as { value: string; confidence: number },
    shift:        safe(dataObject.shift) as { value: string; confidence: number },
    employeeNum:  safe(dataObject.employeeNum) as { value: string; confidence: number },
    opCode:       safe(dataObject.opCode) as { value: string; confidence: number },
    machineNum:   safe(dataObject.machineNum) as { value: string; confidence: number },
    workOrderNum: safe(dataObject.workOrderNum) as { value: string; confidence: number },
    quantity:     safe(dataObject.quantity, null) as { value: number | null; confidence: number },
    timeTaken:    safe(dataObject.timeTaken, null) as { value: number | null; confidence: number },
  }));

  console.log("Extracted Operational Fields (Batch):\n", JSON.stringify(finalResults, null, 2));
  console.log("=== GEMINI OCR EXTRACTOR END ===");

  return finalResults;
}
