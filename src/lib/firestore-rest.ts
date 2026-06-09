// Server-side Firestore reads via REST API (no SDK overhead, runs on Vercel edge).
// Security rules must have `allow read: if true`.

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FsRawValue = Record<string, unknown>;

function parseValue(v: FsRawValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return parseInt(v.integerValue as string, 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) {
    const arr = (v.arrayValue as { values?: FsRawValue[] }).values || [];
    return arr.map(parseValue);
  }
  if ('mapValue' in v) {
    const fields = (v.mapValue as { fields?: Record<string, FsRawValue> }).fields || {};
    return parseFields(fields);
  }
  return null;
}

function parseFields(fields: Record<string, FsRawValue>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, parseValue(v)])
  );
}

export async function queryCollection<T>(
  collectionId: string,
  orderByField: string,
  limitCount: number,
  revalidateSeconds = 30
): Promise<T[]> {
  try {
    const res = await fetch(`${BASE}:runQuery?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          orderBy: [{ field: { fieldPath: orderByField }, direction: 'DESCENDING' }],
          limit: limitCount,
        },
      }),
      cache: revalidateSeconds === 0 ? 'no-store' : 'force-cache',
      ...(revalidateSeconds > 0 && { next: { revalidate: revalidateSeconds } }),
    });
    if (!res.ok) return [];
    const results: Array<{ document?: { name: string; fields: Record<string, FsRawValue> } }> = await res.json();
    return results
      .filter((r) => r.document)
      .map((r) => {
        const doc = r.document!;
        const id = doc.name.split('/').pop()!;
        return { id, ...parseFields(doc.fields) } as T;
      });
  } catch {
    return [];
  }
}
