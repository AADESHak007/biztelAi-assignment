import { ExtractedField, OperationalRecord } from "./mockData";

const SYSTEM_PROMPT = `
You are an expert AI extraction agent for industrial manufacturing logs and operational records.
Your task is to analyze the uploaded handwritten, typed, or semi-structured document and extract the operational data.
Return a valid JSON object matching the following structure. Do not include any extra text or conversational filler, just return the raw JSON block.
Each field MUST be an object containing a "value" and a "confidence" estimate between 0.0 and 1.0 (indicating how clear, legible, or certain the value is in the document).

JSON Structure:
{
  "date": { "value": "YYYY-MM-DD", "confidence": 0.95 },
  "shift": { "value": "A", "confidence": 0.90 }, // Expected: A, B, or C. If handwritten shows something else, extract it.
  "employeeNum": { "value": "EMP-XXXX", "confidence": 0.85 }, // Employee / operator code.
  "opCode": { "value": "OP-XXXX", "confidence": 0.80 }, // Operation or Activity code.
  "machineNum": { "value": "MC-XXXX", "confidence": 0.92 }, // Machine or Station number.
  "workOrderNum": { "value": "WO-XXXXX", "confidence": 0.97 }, // Work Order or Job number.
  "quantity": { "value": 150, "confidence": 0.88 }, // Quantity produced (integer). If empty or illegible, write null or ""
  "timeTaken": { "value": 8.0, "confidence": 0.94 } // Time taken (number of hours). If empty or illegible, write null or ""
}

Ensure your response is valid JSON. Do not wrap in markdown \`\`\`json syntax.
`;

export async function extractDataFromDocument(
  fileBase64: string, // without the data:image/... prefix
  mimeType: string,
  fileName: string,
  apiKey?: string
): Promise<{
  fields: OperationalRecord["fields"];
  isRealAi: boolean;
}> {
  const activeKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // If no Gemini key is provided, trigger the smart simulator!
  if (!activeKey || activeKey.trim() === "" || activeKey === "MOCK_MODE") {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate AI processing delay
    return {
      fields: simulateExtraction(fileName),
      isRealAi: false
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: fileBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Parse the extracted text response
    const cleanedText = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedText);

    // Build the finalized operational fields with safe fallback types
    return {
      fields: {
        date: {
          value: parsed.date?.value || "",
          confidence: Number(parsed.date?.confidence ?? 0)
        },
        shift: {
          value: parsed.shift?.value || "",
          confidence: Number(parsed.shift?.confidence ?? 0)
        },
        employeeNum: {
          value: parsed.employeeNum?.value || "",
          confidence: Number(parsed.employeeNum?.confidence ?? 0)
        },
        opCode: {
          value: parsed.opCode?.value || "",
          confidence: Number(parsed.opCode?.confidence ?? 0)
        },
        machineNum: {
          value: parsed.machineNum?.value || "",
          confidence: Number(parsed.machineNum?.confidence ?? 0)
        },
        workOrderNum: {
          value: parsed.workOrderNum?.value || "",
          confidence: Number(parsed.workOrderNum?.confidence ?? 0)
        },
        quantity: {
          value: parsed.quantity?.value !== undefined && parsed.quantity?.value !== null ? parsed.quantity.value : "",
          confidence: Number(parsed.quantity?.confidence ?? 0)
        },
        timeTaken: {
          value: parsed.timeTaken?.value !== undefined && parsed.timeTaken?.value !== null ? parsed.timeTaken.value : "",
          confidence: Number(parsed.timeTaken?.confidence ?? 0)
        }
      },
      isRealAi: true
    };
  } catch (error) {
    console.error("Real AI Extraction failed. Falling back to simulator.", error);
    // If real extraction failed, fallback to simulator
    return {
      fields: simulateExtraction(fileName),
      isRealAi: false
    };
  }
}

// Smart simulator returning realistic data based on filename keywords
function simulateExtraction(fileName: string): OperationalRecord["fields"] {
  const lowerName = fileName.toLowerCase();
  const todayStr = new Date().toISOString().split("T")[0];

  // Template 1: Invalid shift
  if (lowerName.includes("shift_d") || lowerName.includes("invalid_shift")) {
    return {
      date: { value: todayStr, confidence: 0.94 },
      shift: { value: "D", confidence: 0.38 }, // Invalid shift
      employeeNum: { value: "EMP-2099", confidence: 0.88 },
      opCode: { value: "OP-ASSEM", confidence: 0.91 },
      machineNum: { value: "MC-A1", confidence: 0.90 },
      workOrderNum: { value: "WO-99104", confidence: 0.85 },
      quantity: { value: 120, confidence: 0.89 },
      timeTaken: { value: 8, confidence: 0.94 }
    };
  }

  // Template 2: Suspicious values (quantity and hours)
  if (lowerName.includes("suspicious") || lowerName.includes("high") || lowerName.includes("anomalous")) {
    return {
      date: { value: todayStr, confidence: 0.91 },
      shift: { value: "B", confidence: 0.88 },
      employeeNum: { value: "EMP-4100", confidence: 0.93 },
      opCode: { value: "OP-WELD", confidence: 0.72 },
      machineNum: { value: "MC-W2", confidence: 0.85 },
      workOrderNum: { value: "WO-88910", confidence: 0.92 }, // Might trigger duplicate if WO-88910 exists
      quantity: { value: 1500, confidence: 0.45 }, // Suspiciously high quantity + low confidence
      timeTaken: { value: 16, confidence: 0.91 } // Suspiciously high time taken
    };
  }

  // Template 3: Missing fields and zero quantity
  if (lowerName.includes("missing") || lowerName.includes("empty") || lowerName.includes("zero")) {
    return {
      date: { value: todayStr, confidence: 0.90 },
      shift: { value: "C", confidence: 0.92 },
      employeeNum: { value: "", confidence: 0.20 }, // Missing field
      opCode: { value: "OP-DRILL", confidence: 0.80 },
      machineNum: { value: "MC-B2", confidence: 0.78 },
      workOrderNum: { value: "WO-99050", confidence: 0.91 },
      quantity: { value: 0, confidence: 0.85 }, // Zero quantity
      timeTaken: { value: 6, confidence: 0.88 }
    };
  }

  // Template 4: Duplicate work order simulation
  if (lowerName.includes("dup") || lowerName.includes("duplicate")) {
    return {
      date: { value: todayStr, confidence: 0.95 },
      shift: { value: "A", confidence: 0.94 },
      employeeNum: { value: "EMP-3044", confidence: 0.91 },
      opCode: { value: "OP-PAINT", confidence: 0.89 },
      machineNum: { value: "MC-P1", confidence: 0.92 },
      workOrderNum: { value: "WO-88910", confidence: 0.95 }, // Duplicate work order
      quantity: { value: 240, confidence: 0.90 },
      timeTaken: { value: 8, confidence: 0.93 }
    };
  }

  // Template 5: Weld operation sheet (highly realistic handwriting simulator)
  if (lowerName.includes("weld")) {
    return {
      date: { value: todayStr, confidence: 0.89 },
      shift: { value: "A", confidence: 0.94 },
      employeeNum: { value: "EMP-4022", confidence: 0.74 }, // Medium confidence
      opCode: { value: "OP-WELD", confidence: 0.91 },
      machineNum: { value: "MC-W3", confidence: 0.88 },
      workOrderNum: { value: "WO-99201", confidence: 0.71 }, // Low confidence (handwritten digits)
      quantity: { value: 310, confidence: 0.65 }, // Low confidence (handwritten digits)
      timeTaken: { value: 8, confidence: 0.95 }
    };
  }

  // Template 6: Standard drill operation
  if (lowerName.includes("drill")) {
    return {
      date: { value: todayStr, confidence: 0.96 },
      shift: { value: "B", confidence: 0.95 },
      employeeNum: { value: "EMP-1082", confidence: 0.91 },
      opCode: { value: "OP-DRILL", confidence: 0.89 },
      machineNum: { value: "MC-D2", confidence: 0.93 },
      workOrderNum: { value: "WO-99210", confidence: 0.90 },
      quantity: { value: 450, confidence: 0.88 },
      timeTaken: { value: 7.5, confidence: 0.94 }
    };
  }

  // Default Fallback: Clean valid operational record
  // Pick random operations and machines to keep it dynamic!
  const ops = ["OP-WELD", "OP-DRILL", "OP-PAINT", "OP-ASSEM"];
  const mcs = ["MC-W1", "MC-D4", "MC-P2", "MC-A3"];
  const randOp = ops[Math.floor(Math.random() * ops.length)];
  const randMc = mcs[Math.floor(Math.random() * mcs.length)];
  const randEmp = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  const randWo = `WO-${Math.floor(90000 + Math.random() * 9999)}`;
  const randQty = Math.floor(100 + Math.random() * 400);

  return {
    date: { value: todayStr, confidence: 0.97 },
    shift: { value: ["A", "B", "C"][Math.floor(Math.random() * 3)], confidence: 0.96 },
    employeeNum: { value: randEmp, confidence: 0.92 },
    opCode: { value: randOp, confidence: 0.88 },
    machineNum: { value: randMc, confidence: 0.94 },
    workOrderNum: { value: randWo, confidence: 0.95 },
    quantity: { value: randQty, confidence: 0.91 },
    timeTaken: { value: 8, confidence: 0.97 }
  };
}
