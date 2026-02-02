import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to get a signed URL for private storage files
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export function useSignedUrl(
  bucket: string,
  path: string | null,
  expiresIn: number = 3600
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    const getSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err: any) {
        console.error("Error getting signed URL:", err);
        setError(err.message);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [bucket, path, expiresIn]);

  return { signedUrl, loading, error };
}

/**
 * Get a signed URL on-demand (non-hook version)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }

    return data.signedUrl;
  } catch (err) {
    console.error("Error getting signed URL:", err);
    return null;
  }
}

/**
 * Extract the storage path from a document URL
 * Handles both public URLs and stored paths
 */
export function extractStoragePath(documentUrl: string, bucket: string): string {
  // If it's already a relative path (not a URL), return as-is
  if (!documentUrl.startsWith("http")) {
    return documentUrl;
  }

  // Extract path from Supabase storage URL
  // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path
  const regex = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/(.+?)(?:\\?.*)?$`);
  const match = documentUrl.match(regex);
  
  if (match) {
    return decodeURIComponent(match[1]);
  }

  // Fallback: try to get path after bucket name
  const bucketIndex = documentUrl.indexOf(`/${bucket}/`);
  if (bucketIndex !== -1) {
    const path = documentUrl.substring(bucketIndex + bucket.length + 2);
    // Remove query params if any
    return path.split("?")[0];
  }

  return documentUrl;
}
