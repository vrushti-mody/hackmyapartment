import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Intercepts standard Google Drive share links (which return HTML viewers)
 * and forcefully converts them to raw high-performance Google thumbnail image wrappers.
 */
export function transcodeGoogleDriveUrl(url: string | undefined): string {
  if (!url) return "";
  
  // Return if it's already a well-formed thumbnail
  if (url.includes("drive.google.com/thumbnail") && url.includes("sz=")) {
    return url;
  }

  // Match: /file/d/[ID]
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=s2000`;
  }

  // Match: ?id=[ID]
  const queryIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryIdMatch && queryIdMatch[1] && url.includes("drive.google.com")) {
    return `https://drive.google.com/thumbnail?id=${queryIdMatch[1]}&sz=s2000`;
  }

  return url;
}
