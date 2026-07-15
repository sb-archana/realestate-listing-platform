/**
 * Keyset (cursor) pagination helpers.
 *
 * Instead of OFFSET-based paging (which forces Postgres to scan and discard
 * every prior row — ruinous once you're 40,000 rows into a 50,000 row table),
 * the cursor encodes the last row's sort key + id tiebreaker. The next page's
 * WHERE clause seeks directly to that point using the matching composite
 * index, so the query cost stays roughly constant no matter how deep the
 * page is.
 */

export interface Cursor {
  sortValue: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(raw: string): Cursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed.sortValue === "string" && typeof parsed.id === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
