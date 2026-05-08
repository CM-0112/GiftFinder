# Wishlist MVP

## Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** PostgreSQL via Supabase
- **Auth:** NextAuth.js (Google OAuth)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## Getting started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `schema.sql`
3. Copy your project URL and keys from **Settings > API**

### 3. Set up Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project → **APIs & Services > Credentials**
3. Create an OAuth 2.0 Client ID (Web application)
4. Add `http://localhost:3000/api/auth/callback/google` as an authorised redirect URI

### 4. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in all values in `.env.local`.

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
    scrape/               # POST OG scraper
    users/search/         # GET user search
    wishlist/             # GET list, POST add item
    wishlist/[id]/        # PATCH edit/claim, DELETE remove
  (auth)/login/           # Login page
  (app)/
    profile/              # Profile page (gated wishlist)
    wishlist/             # Owner wishlist management
    connections/          # Connections + pending inbox
components/
  connections/            # Connection UI components
  wishlist/               # Wishlist UI components
  ui/                     # Shared UI primitives
lib/
  auth.ts                 # NextAuth config
supabase/
  client.ts               # Browser Supabase client
  server.ts               # Server Supabase client
types/
  index.ts                # All TypeScript types
schema.sql                # Full database schema (run in Supabase SQL editor)
```

---

## API reference

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
| PATCH | `/api/wishlist/[id]` | Edit item (owner) or claim (connected user) |
| DELETE | `/api/wishlist/[id]` | Delete item (owner only) |

### Scraper
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/scrape` | Scrape OG data from a URL |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/search?q=` | Search users by username |

---

## Deployment (Vercel)
1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all `.env.local` values as environment variables in Vercel's project settings
4. Update your Google OAuth redirect URI to your production domain
5. Deploy
