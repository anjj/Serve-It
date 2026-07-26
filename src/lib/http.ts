/** Defensively parses a request body as JSON, returning null on invalid/empty payloads. */
export async function parseJsonBody(request: Request): Promise<unknown | null> {
  try {
    const text = await request.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;
