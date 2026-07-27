import { supabase } from './supabase';
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'serve-it';

export async function uploadHtmlFile(customerId: string, fileId: string, htmlContent: string): Promise<string> {
  const path = `tenants/${customerId}/files/${fileId}.html`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, htmlContent, { contentType: 'text/html', upsert: true });
  if (error) throw new Error(`Failed to upload file to storage: ${error.message}`);
  return path;
}

export async function getSignedUrl(path: string, expiresIn = 60): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, expiresIn);
  if (error || !data) throw new Error(`Failed to generate signed URL: ${error?.message}`);
  return data.signedUrl;
}

export async function downloadFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
  if (error || !data) throw new Error(`Failed to download file: ${error?.message}`);
  return data;
}

export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw new Error(`Failed to delete file: ${error.message}`);
}

export async function deleteCustomerStorage(customerId: string): Promise<number> {
  const bucket = supabase.storage.from(BUCKET_NAME);
  let deletedCount = 0;

  async function walk(prefix: string): Promise<string[]> {
    let allPaths: string[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const { data, error } = await bucket.list(prefix, { limit, offset });
      if (error) {
        throw new Error(`Failed to list storage path ${prefix}: ${error.message}`);
      }
      if (!data || data.length === 0) {
        break;
      }

      for (const item of data) {
        const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) {
          const subPaths = await walk(itemPath);
          allPaths.push(...subPaths);
        } else {
          allPaths.push(itemPath);
        }
      }

      if (data.length < limit) {
        break;
      }
      offset += limit;
    }

    return allPaths;
  }

  const pathsToPurge = await walk(`tenants/${customerId}`);

  if (pathsToPurge.length === 0) {
    return 0;
  }

  const batchSize = 100;
  for (let i = 0; i < pathsToPurge.length; i += batchSize) {
    const batch = pathsToPurge.slice(i, i + batchSize);
    const { error } = await bucket.remove(batch);
    if (error) {
      throw new Error(`Failed to delete storage batch: ${error.message}`);
    }
    deletedCount += batch.length;
  }

  return deletedCount;
}
