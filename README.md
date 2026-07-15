# EstateHub — Real Estate Listing Platform

A fullstack real-estate listing platform (99acres/NoBroker-style) built as a technical assignment.

**Stack:** Next.js 16 (App Router) + Tailwind CSS · Node.js + Express + TypeScript · PostgreSQL + Prisma · Swagger/OpenAPI

```
real-estate-listing-platform/
  server/   Express API, Prisma schema/migrations, seed script
  client/   Next.js frontend
```

## 1. Setup

### Prerequisites
- Node.js 20+
- PostgreSQL running locally (tested against Postgres 14)

### Backend

```bash
cd server
npm install
cp .env.example .env        # edit DATABASE_URL / secrets as needed
createdb real_estate         # or: psql -c "CREATE DATABASE real_estate;"
npx prisma migrate deploy    # applies schema + pg_trgm indexes
npm run seed                 # seeds 300 users + 50,500 properties (~30s)
npm run dev                  # http://localhost:4000
```

API docs: **http://localhost:4000/api-docs**

Demo login (created by the seed script): `demo@realestate.test` / `Password123!`

### Frontend

```bash
cd client
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:4000
npm run dev                        # http://localhost:3000
```

The two apps are independent processes talking over HTTP; start the backend first.

---

## 2. Architecture & key decisions

### Auth
- **Access token**: short-lived (15 min) JWT, sent as `Authorization: Bearer`, verified by an `authenticate` middleware.
- **Refresh token**: opaque random token, stored as an `httpOnly`, `sameSite=lax` cookie; only its SHA-256 hash is persisted server-side (`refresh_tokens` table) with an expiry. `/api/auth/refresh` **rotates** the token on every use (issue new + revoke old), so a replayed stolen token is detectable/revocable rather than silently reusable forever.
- Frontend keeps the access token in memory only (React context) — never `localStorage` — to limit XSS blast radius; a page reload silently re-derives it by calling `/api/auth/refresh` against the httpOnly cookie.
- Passwords hashed with bcrypt (cost 12, via `bcryptjs` for portability).

### Ownership & authorization
A single `loadPropertyAndCheckOwnership` middleware (`server/src/middleware/ownership.ts`) loads the property once, 404s if missing, 403s if `property.ownerId !== req.user.id`, and attaches the row to `req.property` so edit/delete/leads controllers never re-query or duplicate the check.

### Search, filter, sort, pagination — the 50,000+ row requirement
- **Cursor (keyset) pagination**, not `OFFSET`. Each response includes a `nextCursor` encoding the last row's sort key + `id` tiebreaker; the next page's query seeks directly to that point (`"createdAt" < $cursor OR ("createdAt" = $cursor AND "id" < $id)`) via a matching composite index, so query cost stays flat regardless of how deep the page is — unlike `OFFSET N`, which forces Postgres to scan and discard N rows first.
- Composite indexes back every supported filter/sort combination: `(status, createdAt, id)` for date sort, `(status, price, id)` for price sort, `(city, propertyType, price)` for the common filter+similar-properties combo.
- City search uses a `pg_trgm` GIN index (`idx_property_city_trgm`) for fast partial/`ILIKE` matching instead of a sequential scan.
- No `COUNT(*)` on the hot path — counting 50k+ rows on every search request is wasted work; the response only reports `hasMore`.
- Verified with `EXPLAIN ANALYZE` against the seeded 50,500-row table: all listing/filter/similar-properties queries execute as index (range/bitmap) scans in well under 2ms — see below.

### Similar properties
Same `city` + `propertyType`, price within ±20%, ordered by closeness of price then bedrooms, `LIMIT 6` — deliberately a simple, explainable, **index-backed SQL query** (reuses `idx_city_type_price`) rather than a collaborative-filtering/ML approach, which would need interaction history this app doesn't collect and would be unverifiable at this data volume. Runs in parallel with the main detail fetch.

### Lead / inquiry protection
- **Duplicate prevention**: before insert, checks for an existing inquiry with the same `(propertyId, email)` in the last 24h — an index lookup on `idx_property_email_created`, not a table scan — and returns `409` instead of creating a duplicate.
- **Rate limiting**: `express-rate-limit`, 5 inquiries/hour per IP (also applied to login/register to blunt brute-force/credential-stuffing).
- **Honeypot**: a hidden `website` field real users never see or fill; if a bot fills it, the request is silently accepted (`201`) without inserting a row, so the bot doesn't learn it was detected.
- Server-side Zod validation on all fields (email format, phone format, message length caps).

### Image handling
Multer, disk storage, `fileFilter` restricted to JPEG/PNG/WebP, size/count caps (`MAX_IMAGE_SIZE_MB`, `MAX_IMAGES_PER_PROPERTY`), served statically from `/uploads`. Seed data uses external placeholder URLs (picsum.photos) rather than 150k+ real files on disk, to keep the seed fast — real uploads still go through the Multer pipeline and are stored locally.

### SEO
- `app/properties/[id]/page.tsx` is a **Server Component** — no client-side fetch waterfall.
- **No `generateStaticParams`**: pre-rendering 50,000+ pages at build time doesn't scale. Instead, each fetch uses `next: { revalidate: 60 }` (ISR): first visit renders and caches, subsequent visits within 60s are served from cache — the standard pattern for large dynamic catalogs.
- `generateMetadata()` builds title, description, canonical URL, and Open Graph tags from live property data; JSON-LD (`schema.org/Product`) is injected for rich results.
- The search results page (`/properties?city=...`) is also server-rendered on first load so filtered/shared URLs are crawlable with real content, then hydrates into an interactive client component for filtering and "load more".

### API documentation
Hand-authored OpenAPI 3.0 spec (`server/src/docs/openapi.json`) covering every endpoint, request/response schema, and the bearer-auth security scheme, served via `swagger-ui-express` at `/api-docs`.

---

## 3. Query performance evidence

Against the seeded 50,500-property table (`EXPLAIN ANALYZE`, see full output during development):

| Query | Plan | Execution time |
|---|---|---|
| Newest listings, first page (keyset) | Index-only scan, `idx_status_created_id` | ~0.2ms |
| City filter + sort | Index scan, `idx_status_created_id` (planner-chosen over trgm at this selectivity) | ~1.1ms |
| Similar properties (city+type+price band) | Bitmap index scan, `idx_city_type_price` | ~0.2ms |

No sequential scans on any of the core listing/search/recommendation paths.

---

## 4. What's not included / known tradeoffs

- No automated test suite (unit/integration) — scope was prioritized toward a complete, correctly-verified feature set across auth, listings, search, leads, and SEO within the assignment window. Manual end-to-end verification (curl-driven for the API, SSR HTML/metadata inspection for the frontend) is documented in the build process.
- Bedroom filter is an exact match (`bedrooms = N`), not "N or more" — matches the literal "filter by bedrooms" requirement; easy to change to a `>=` comparison if a minimum-bedrooms UX is preferred.
- Images are stored on local disk, per the assignment's local-first constraint (no Firebase/Supabase/cloud buckets) — swappable for S3-compatible storage later by changing only `middleware/upload.ts` and the image URL builder.
