import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, ref as firebaseStorageRef, uploadBytes, getDownloadURL, type FirebaseStorage } from "firebase/storage"; // Aliased ref
import { getFirestore, type Firestore } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

// Your web app's Firebase configuration (Hardcoded from user input)

let app: FirebaseApp;

// Initialize Firebase App
// This structure ensures initializeApp is called only once,
// regardless of whether it's client or server.
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("CRITICAL: Firebase app initialization failed.", error);
    // Depending on the app's needs, you might want to throw this error
    // to halt further execution if Firebase is essential.
    // For now, subsequent service initializations will likely fail if 'app' is not set.
    // However, initializeApp itself usually throws if config is severely wrong.
  }
} else {
  app = getApp();
}

// Initialize Firebase Services
// These services depend on 'app' being successfully initialized.
// If 'app' is undefined due to an earlier critical error, these lines will throw.
// Using non-null assertion `app!` as Firebase is critical for this app.
// If app could not be initialized, these would fail, which is intended.
const auth: Auth = getAuth(app!);
const storage: FirebaseStorage = getStorage(app!);
const db: Firestore = getFirestore(app!);

export async function uploadPdf(file: File): Promise<string> {
  if (!storage) {
    console.error("Firebase Storage is not available for uploadPdf. Initialization might have failed.");
    throw new Error("Firebase Storage is not initialized.");
  }
  if (!file || file.type !== "application/pdf") {
    throw new Error("Invalid file type. Only PDF is allowed.");
  }

  const fileName = `${uuidv4()}-${file.name}`;
  const fileRef = firebaseStorageRef(storage, `quizzes_pdfs/${fileName}`);

  try {
    // For large files, we'll use a chunked upload approach
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    // Create a metadata object with content type
    const metadata = {
      contentType: 'application/pdf',
      customMetadata: {
        originalName: file.name,
        totalChunks: totalChunks.toString()
      }
    };

    // Upload the file
    const snapshot = await uploadBytes(fileRef, file, metadata);
    
    // Verify the upload was successful
    if (!snapshot || !snapshot.ref) {
      throw new Error('Upload completed but no snapshot returned');
    }

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Verify the URL is valid
    if (!downloadURL || !downloadURL.startsWith('https://')) {
      throw new Error('Invalid download URL generated');
    }

    return downloadURL;
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error);
    
    // Handle specific Firebase Storage errors
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('Unauthorized to upload files. Please check your authentication status.');
      } else if (error.message.includes('storage/canceled')) {
        throw new Error('Upload was canceled. Please try again.');
      } else if (error.message.includes('storage/retry-limit-exceeded')) {
        throw new Error('Upload failed after multiple retries. Please check your internet connection and try again.');
      } else if (error.message.includes('storage/invalid-checksum')) {
        throw new Error('File upload failed due to corruption. Please try uploading the file again.');
      }
    }
    
    // Generic error handling
    throw new Error(`Failed to upload PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export { app, auth, storage, db };
