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
            const mimeType = matches[1]; // Renamed contentType to mimeType for clarity
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");

            // 5. Generate a unique file name
            const fileExtension = mimeType.split("/")[1] || "jpg";
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
            const filePath = `${path}/${uid}/${fileName}`;

            // 6. Upload the file to Firebase Storage
            // Explicitly specify the bucket name (process.env.GCLOUD_PROJECT is not available in Cloud Functions)
            const bucketName = "marche-order-app.firebasestorage.app";
            console.log(`[uploadImage] Target bucket: ${bucketName}`);

            try {
              const bucket = storage.bucket(bucketName);
              const file = bucket.file(filePath);

              console.log(`[uploadImage] Saving file to: ${filePath}`);
              await file.save(buffer, {
                metadata: {
                  contentType: mimeType,
                },
              });
              console.log("[uploadImage] File saved successfully.");
            } catch (storageError: any) {
              console.error("[uploadImage] Storage save error:", storageError);
              throw new functions.https.HttpsError("internal", `Storage save failed: ${storageError.message}`);
            }

            // 7. Get the public URL
            // Since we are using a private bucket with public access allowed via IAM,
            // we can construct the URL manually or use getSignedUrl (but we want a permanent public URL).
            // For Firebase Storage, the download URL format is:
            // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=<token>
            // However, generating a token requires the uuid package or similar.
            // Alternatively, since we made the bucket public (or at least the objects), we can use the public link.
            // But file.publicUrl() returns the storage.googleapis.com URL which might not work with CORS easily.

            // Let's try to construct the Firebase Storage URL manually.
            // Note: This assumes the object is publicly readable.
            const encodedPath = encodeURIComponent(filePath).replace(/\//g, "%2F");
            const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media`;

            console.log("[uploadImage] Generated public URL:", publicUrl);

            return { url: publicUrl };
          } catch (error: any) {
            console.error("[uploadImage] Error uploading image:", error);
            // Ensure we throw an HttpsError so the client receives a structured error
            if (error instanceof functions.https.HttpsError) {
              throw error;
            }
            throw new functions.https.HttpsError("internal", `Upload failed: ${error.message}`);
          }
        });
