import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

/**
 * Upload a file buffer to Cloudinary.
 * Returns { secure_url, public_id, bytes, format }.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ secure_url: string; public_id: string; bytes: number; format: string }> {
  return new Promise((resolve, reject) => {
    // Determine resource_type: 'raw' for PDFs so they stay downloadable
    const resourceType =
      mimeType === "application/pdf" ? "raw" : "image";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "biztelai-uploads",
        resource_type: resourceType,
        public_id: `${Date.now()}-${originalName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "")}`,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id:  result.public_id,
          bytes:      result.bytes,
          format:     result.format,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by its public_id.
 */
export async function deleteFromCloudinary(
  publicId: string,
  mimeType: string
): Promise<void> {
  const resourceType = mimeType === "application/pdf" ? "raw" : "image";
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default cloudinary;
