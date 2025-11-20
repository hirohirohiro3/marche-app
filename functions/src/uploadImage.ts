import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { CallableContext } from "firebase-functions/v1/https";

// Initialize admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const storage = admin.storage();

interface UploadImageData {
  imageDataUrl: string; // Base64 encoded image data URL (e.g., data:image/jpeg;base64,...)
  path: string; // The path to upload the file to in Storage (e.g., 'menuItems' or 'qrCodeLogos')
}

export const uploadImage = functions
  .region("asia-northeast1")
  .https.onCall(async (data: UploadImageData, context: CallableContext) => {
    // 1. Check for authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const uid = context.auth.uid;

    const { imageDataUrl, path } = data;

    // 2. Validate input
    if (!imageDataUrl || !path) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with 'imageDataUrl' and 'path' arguments."
      );
    }

    if (!imageDataUrl.startsWith("data:image/")) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The 'imageDataUrl' must be a valid data URL string."
      );
    }

    // 3. Size validation: 1MB limit for the base64 string
    // 1MB in bytes = 1,048,576. Base64 is ~33% larger. 1.4M chars is a safe limit.
    if (imageDataUrl.length > 1400000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The image data is too large. Max size is approximately 1MB."
      );
    }

    try {
      // 4. Decode the Base64 string
      const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid image data URL format."
        );
      }
      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // 5. Generate a unique file name
      const fileExtension = contentType.split("/")[1] || "jpg";
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      const filePath = `${path}/${uid}/${fileName}`;

      // 6. Upload the file to Firebase Storage
      // Explicitly specify the bucket to prevent resolution issues
      const bucketName = `${process.env.GCLOUD_PROJECT}.firebasestorage.app`;
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);

      await file.save(buffer, {
        metadata: {
          contentType: contentType,
        },
      });

      // Make the file publicly readable
      await file.makePublic();

      // 7. Get the public URL. Note: `file.publicUrl()` is the correct method.
      const publicUrl = file.publicUrl();

      // 8. Return the URL to the client
      return { imageUrl: publicUrl };
    } catch (error) {
      console.error("Image upload failed:", error);
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        "An unexpected error occurred while uploading the image."
      );
    }
  });
