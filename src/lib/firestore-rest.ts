// Server-side Firestore reads via REST API (no SDK overhead, runs on Vercel edge).
// Security rules must have `allow read: if true`.

const clean = (v?: string) => (v || '').replace(/[^\x20-\x7E]/g, '').trim();
const PROJECT_ID = clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const API_KEY = clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
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

// ── 쓰기 (REST POST) — 클라 SDK 연결 hang 우회 ──────────────────────────────
function encodeValue(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  return { stringValue: String(v) };
}

export async function createDocument(
  collectionId: string,
  data: Record<string, unknown>
): Promise<string> {
  const fields: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(data)) fields[k] = encodeValue(val);

  const res = await fetch(`${BASE}/${collectionId}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = `저장 실패 (HTTP ${res.status})`;
    try { msg = (await res.json())?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const doc = await res.json();
  return (doc.name as string).split('/').pop()!;
}

export async function deleteDocument(collectionId: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/${collectionId}/${id}?key=${API_KEY}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
  if (!res.ok && res.status !== 404) {
    let msg = `삭제 실패 (HTTP ${res.status})`;
    try { msg = (await res.json())?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
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
