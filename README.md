# Gift Finder

A social wishlist app that helps people share what they want and gift with confidence. No more duplicate gifts, no more guessing.

**Live app:** [gift-finder-nine.vercel.app](https://gift-finder-nine.vercel.app)

---

## What it does

- **Wishlist** — Add items you'd love to receive by pasting a product URL. Details auto-fill from the page. Share your list with a private link or with your connections.
- **Connections** — Connect with friends and family to see each other's wishlists. Requests must be accepted before wishlists are visible.
- **Claiming** — Connections can claim items ("I'll get this") to prevent duplicate gifts. The owner never sees what's been claimed — it's a surprise.
- **Items I've Claimed** — Track everything you've claimed across your connections' wishlists, grouped by person.
- **Public share link** — A secret random link (not guessable from your username) you can send to anyone, including people not on the platform. Read-only view with a soft nudge to join.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | PostgreSQL via Supabase |
| Auth | NextAuth.js (Google OAuth) |
| Styling | Tailwind CSS + inline styles |
| Deployment | Vercel |

---

## Getting started locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `schema.sql`
3. Go to **Settings → API** and copy your Project URL and keys

### 3. Set up Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI

### 4. Configure environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret  # generate: openssl rand -base64 32

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Run locally
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project structure

```
app/
  api/
    auth/[...nextauth]/   # NextAuth handler
    connections/          # GET list, POST send request
    connections/[id]/     # PATCH accept, DELETE decline/remove
    gifts-giving/         # GET items claimed by current user
    scrape/               # POST OG + Shopify scraper
    share/                # GET wishlist by public token (no auth)
    users/
      search/             # GET search users by username
      check-username/     # GET check username availability
      username/           # PATCH update username + display name
    wishlist/             # GET list, POST add item
    wishlist/[id]/        # PATCH edit/claim/reset, DELETE remove
  (auth)/
    login/                # Login page (Google OAuth)
    setup/                # First sign-in username + name setup
  (app)/
    [username]/           # Profile page — gated by connection status
    connections/          # Connections + pending inbox
    gifts-giving/         # Items I've Claimed page
    wishlist/             # Owner wishlist management
  share/[token]/          # Public share page (no login required)
components/
  ItemImage.tsx           # Image with 🎁 emoji fallback
lib/
  auth.ts                 # NextAuth config
supabase/
  client.ts               # Browser Supabase client
  server.ts               # Server Supabase client
types/
  index.ts                # TypeScript types
schema.sql                # Full database schema
```

---

## API reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handler |

### Connections
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/connections` | List connections + pending requests |
| POST | `/api/connections` | Send a connection request |
| PATCH | `/api/connections/[id]` | Accept a pending request |
| DELETE | `/api/connections/[id]` | Decline or remove a connection |

### Wishlist
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wishlist?username=` | Fetch a user's wishlist (connection check enforced) |
| POST | `/api/wishlist` | Add a new item |
| PATCH | `/api/wishlist/[id]` | Edit (owner), claim (connection), or reset claim (owner) |
| DELETE | `/api/wishlist/[id]` | Delete item (owner only) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search users by username |
| GET | `/api/users/check-username?username=` | Check username availability |
| PATCH | `/api/users/username` | Update username and display name |

### Scraper
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/scrape` | Scrape product data from a URL |

The scraper uses a two-tier approach:
- **Shopify JSON API** — for any URL with `/products/` in the path (Sephora, Skin1004, most DTC brands). Returns exact variant price and title.
- **OG tag fetch** — server-side fetch with full Chrome headers for all other sites.

All scrape attempts are logged to `scrape_logs` by domain for failure rate tracking.

### Share
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/share?token=` | Fetch wishlist by public token (no auth required) |

### Gifts I've Claimed
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/gifts-giving` | All items claimed by the current user |

---

## Key design decisions

- **Claimed status is hidden from the wishlist owner** — preserves gift surprise. The owner sees all items as available; only connections see what's claimed.
- **Claim identity is not shown to the owner** — `claimed_by` is stored in the database but the owner's queries never return it.
- **Public share link uses a random token** — not guessable from the username. The token is generated at account creation.
- **No third-party scraping APIs** — kept free by using Shopify's public product JSON endpoint and improved OG tag fetching with browser-like headers.
- **Service role Supabase client** — all API routes use the service role client and perform authorization checks in code, not via RLS `auth.uid()`, since the service role bypasses RLS.

---

## Deployment

Deployed on Vercel. Every push to `main` triggers a new deployment automatically.

After deploying, make sure to:
1. Update `NEXTAUTH_URL` in Vercel environment variables to your production URL
2. Add your production URL to Google OAuth authorised redirect URIs: `https://your-url.vercel.app/api/auth/callback/google`

---

## Roadmap

| Phase | Scope |
|---|---|
| ✅ MVP | Wishlist, connections, claiming, public share link |
| Next | Notifications (claims, connection requests), settings page (update username, display name) |
| Future | AI gift suggestions based on community wishlist data |
