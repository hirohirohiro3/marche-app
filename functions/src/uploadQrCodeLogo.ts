
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Define a central region for all functions
const region = "asia-northeast1";

// Ensure Firebase Admin is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const storage = admin.storage();

export const uploadQrCodeLogo = functions.region(region).https.onCall(async (data, context) => {
  // 1. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // 2. Data Validation
  if (!data.file || !data.fileType) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'file' (base64 string) and 'fileType' arguments."
    );
  }

  const { file, fileType } = data;
  const storeId = context.auth.uid;

  try {
    // 3. Decode the Base64 string to a Buffer
    const base64EncodedImageString = file.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64EncodedImageString, "base64");

    // 4. Prepare for upload
    const bucket = storage.bucket();
    const fileExtension = fileType.split("/")[1] || "png"; // e.g., 'image/png' -> 'png'
    const fileName = `qr-code-logos/${storeId}/${uuidv4()}.${fileExtension}`;
    const fileUpload = bucket.file(fileName);

    // 5. Upload the file
    await fileUpload.save(imageBuffer, {
      metadata: {
        contentType: fileType,
        // Optional: Add cache control for optimization
        cacheControl: "public, max-age=31536000",
      },
    });

    // 6. Get the public URL
    // Note: getSignedUrl is another option if you need temporary, secure URLs.
    // For a public logo, a simple public URL is often sufficient.
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    console.log(`Successfully uploaded logo for store ${storeId} to ${publicUrl}`);

    // 7. Return the URL to the client
    return {
      message: "Image uploaded successfully!",
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while uploading the image.",
      error
    );
  }
});
