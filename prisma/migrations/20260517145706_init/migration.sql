-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "date" TEXT NOT NULL DEFAULT '',
    "shift" TEXT NOT NULL DEFAULT '',
    "employeeNum" TEXT NOT NULL DEFAULT '',
    "opCode" TEXT NOT NULL DEFAULT '',
    "machineNum" TEXT NOT NULL DEFAULT '',
    "workOrderNum" TEXT NOT NULL DEFAULT '',
    "quantity" DOUBLE PRECISION,
    "timeTaken" DOUBLE PRECISION,
    "confDate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confShift" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confEmployeeNum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confOpCode" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confMachineNum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confWorkOrderNum" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confTimeTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'valid',
    "manualNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationError" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Record_uploadId_key" ON "Record"("uploadId");

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationError" ADD CONSTRAINT "ValidationError_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
