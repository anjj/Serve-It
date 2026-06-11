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
