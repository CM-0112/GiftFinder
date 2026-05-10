# Gift Finder — Product Requirements Document
**MVP** · Status: Shipped · Version: 3 · May 2026

| | |
|---|---|
| **Status** | Shipped |
| **Version** | 3 |
| **Date** | May 2026 |
| **Owner** | Product |
| **Reviewers** | Engineering, Design |

---

## 1. Overview

Gift Finder is a social wishlist app that helps people share what they want and gift with confidence. No more duplicate gifts, no more guessing.

The MVP covers two interconnected features: a social graph (connections between users) and a wishlist visible exclusively to those connections. It also includes a public share link for non-users, a personal claims tracker, and an AI-assisted scraper for auto-filling product details.

The app is live at [gift-finder-nine.vercel.app](https://gift-finder-nine.vercel.app).

---

## 2. Problem statement

When someone wants to share gift ideas with friends or family, the current options are either too heavy (registries tied to a specific retailer) or too informal (a notes app screenshot sent over WhatsApp). Neither solves the duplicate problem — two people buying the same thing.

Beyond the wishlist itself, there is no lightweight way for users to establish a trusted network of gift-givers and recipients within a single product. Without that social layer, wishlist visibility has no meaningful access control.

> **Goal:** Give users a private wishlist their connections can browse — so gift-givers always know what they want, at what price, and whether it's already been claimed. The connections system is the access layer that makes this possible.

---

## 3. Target users

**Wishlist owner (registered user)**

- Wants to communicate gift preferences without feeling demanding
- Shops across multiple retailers — doesn't want to be locked into one store's registry
- Updates the list occasionally as tastes change or occasions approach

**Gift-giver (connected user)**

- Is already a registered user and connected to the wishlist owner
- Visits a friend's wishlist when an occasion is approaching
- Wants to quickly see what's available, pick something, and claim it without doubling up

**Anonymous visitor (non-user)**

- Arrives via a shared public link
- Can view the wishlist read-only without creating an account
- Sees a soft nudge to join Gift Finder

**New user (no connections yet)**

- Just signed up and needs to choose a username and display name
- Needs a clear path to find people they know and send connection requests

---

## 4. Scope — MVP (shipped)

**Connections (social graph)**
- User search by username
- Send, accept, and decline connection requests
- View confirmed connections list
- Remove an existing connection
- Pending requests inbox with badge count
- Gated profile page — connected vs. non-connected state

**Wishlist**
- Wishlist creation and management for registered users
- Adding items by pasting a URL — auto-fill via two-tier scraper (Shopify JSON API + OG tags)
- Manual override of any auto-filled field
- Price field with automatic `$` prefix
- Optional notes field per item
- Connections-only visibility
- Public share link via random token (unguessable, not based on username)
- Claim flow for connected gift-givers with `claimed_by` stored server-side
- Owner sees all items as available (claimed status hidden to preserve surprise)
- Connections see real claimed status with personalised labels (you vs. someone else)
- Owner claim reset
- Items I've Claimed tab — personal tracker of all claims across connections' wishlists
- Domain failure logging for scrape quality tracking
- Image fallback to 🎁 emoji when product image is blocked or missing
- HTML entity decoding in scraped product names

**Auth & onboarding**
- Google OAuth sign-in
- First sign-in username + display name setup screen
- Username availability check with debounced validation

**Infrastructure**
- Deployed on Vercel (free tier)
- PostgreSQL via Supabase with Row Level Security
- Mobile-responsive with hamburger nav on mobile

**Out of scope for MVP:**
- Multiple wishlists per user
- Notifications (email or push)
- Settings page (username/name editing post-setup)
- Comments or notes from gift-givers
- Purchase / affiliate integration
- Import from Amazon or other registries
- Product catalog search
- AI gift suggestions

---

## 5. User stories

### 5.1 Onboarding

- As a new user, I can sign in with Google.
- As a new user, I am prompted to choose a username and display name on first sign-in before accessing the app.
- As a new user, I can check username availability in real time as I type.

### 5.2 Connections

- As a user, I can search for other users by username.
- As a user, I can send a connection request to another user.
- As a user, I can accept or decline an incoming connection request.
- As a user, I can see a list of my pending incoming requests with a badge count in the nav.
- As a user, I can view my list of confirmed connections.
- As a user, I can remove an existing connection at any time.
- As a non-connected visitor, I can see a user's profile page (name, avatar) but not their wishlist, with a prompt to connect.

### 5.3 Wishlist owner

- As an owner, I can add an item by pasting a product URL so that the name, price, and brand are filled in automatically.
- As an owner, I can manually edit any auto-filled field.
- As an owner, I can enter a price that is automatically prefixed with `$`.
- As an owner, I can add an optional note to an item (size, colour, variant, etc.).
- As an owner, I can remove an item from my list at any time.
- As an owner, I can copy my share link to send to anyone — including non-users.
- As an owner, I cannot see which of my items have been claimed — all items appear available to me, preserving the gift surprise.
- As an owner, I can reset a claimed item back to unclaimed if needed.

### 5.4 Gift-giver (connected user)

- As a gift-giver, I can browse a connected friend's wishlist.
- As a gift-giver, I can see each item's name, brand, price, image, and owner note.
- As a gift-giver, I can mark an item as "I'll get this" to claim it.
- As a gift-giver, I can see items already claimed — with a blue "You've claimed this" badge for items I claimed, and a yellow "Someone's getting this" badge for items others claimed.
- As a gift-giver, I cannot claim an item someone else has already claimed.
- As a gift-giver, I can follow the product URL to purchase the item.

### 5.5 Items I've Claimed

- As a user, I can view all items I've claimed across my connections' wishlists, grouped by person.
- As a user, I can unclaim an item from this view if my plans change.
- As a user, I can navigate directly to a connection's wishlist from this view.

### 5.6 Public share page

- As an owner, I can share a public link (random token, not my username) with anyone including non-users.
- As an anonymous visitor, I can view the wishlist read-only without logging in.
- As an anonymous visitor, I can see which items are claimed (by others) but cannot claim items myself.
- As an owner viewing my own share link, I cannot see claimed status — all items appear available to me.
- As an anonymous visitor, I see a soft prompt to join Gift Finder (non-blocking).

---

## 6. Feature specification

### 6.1 Connections

**User search** — search by partial username match, logged-in users only. Results show avatar, display name, username, and relationship status.

**Connection states:**

| State | Description |
|---|---|
| None | No relationship; profile visible but wishlist gated |
| Pending (sent) | Current user sent a request; awaiting response |
| Pending (received) | Current user has an incoming request to action |
| Connected | Confirmed connection; wishlist visible to both parties |

**Request flow** — requester sends → recipient sees in pending inbox → accept or decline. Declined requests are deleted, not stored. Either party can remove a connection at any time.

### 6.2 Adding an item via URL

Two-tier scraper:

1. **Tier 1 — Shopify JSON API (free):** For any URL with `/products/` in the path, the system hits `[store]/products/[handle].json` directly. Returns exact product name, brand, price, and image. Also reads the variant from the URL query string (e.g. `?variant=123`) and pre-fills the correct variant price and title into the note field.
2. **Tier 2 — OG tag fetch (free fallback):** For all other URLs, performs a server-side fetch with full Chrome-like headers to reduce bot detection. Extracts Open Graph tags, structured data, and JSON-LD schema markup.

All scrape attempts are logged to `scrape_logs` by domain. Scraped text is HTML entity decoded (e.g. `&amp;` → `&`).

If both tiers fail, the form opens empty for manual entry. The original URL is preserved as the purchase link.

**Fields per item:**

| Field | Source | Required | Notes |
|---|---|---|---|
| Item name | Auto-filled | Yes | Max 120 characters; HTML entities decoded |
| Brand | Auto-filled | No | Retailer or brand name |
| Price | Auto-filled | No | Stored as display string; `$` prefix auto-added on manual entry |
| Image | Auto-filled | No | Falls back to 🎁 emoji if missing or blocked by CDN |
| Product URL | Input by user | No | Shown as purchase link to gift-givers |
| Owner note | Manual | No | Max 200 characters; variant info pre-filled from Shopify scrape |

### 6.3 Wishlist view (owner)

- Full item list with image (or 🎁 fallback), name, brand, price, note
- All items appear unclaimed — claimed status hidden from owner
- Subtitle shows total item count only (no claimed/available split)
- Inline delete per item
- Share wishlist button copies the public share token URL (not the profile URL)

### 6.4 Wishlist view (gift-giver / connected)

- Read-only item cards with image, name, brand, price, note
- Unclaimed items show "I'll get this" button
- Claimed items show personalised badge:
  - **Blue** — "✓ You've claimed this" (claimed by the current viewer)
  - **Yellow** — "Someone's getting this" (claimed by someone else)
- Claimed items shown at reduced opacity
- Stats bar shows available and claimed counts

### 6.5 Public share page

- Accessible at `/share/[token]` — no login required
- Token is a random hex string, generated at account creation, not derivable from username
- Read-only view: image, name, brand, price, note
- Claimed status shown to non-owners (yellow badge)
- Owner viewing their own share link sees no claimed status (identified by session username match)
- Top banner: "Want to create your own wishlist or claim gifts? Join Gift Finder" — non-blocking
- Bottom CTA card to encourage sign-up

### 6.6 Claim flow

1. Gift-giver taps "I'll get this" on an unclaimed item.
2. Item is immediately marked claimed with `claimed = true`, `claimed_at`, and `claimed_by = userId`.
3. `claimed_by` is stored server-side but never returned to the owner — only used to power the "You've claimed this" label for the claimer and the Items I've Claimed page.
4. Gift-givers cannot unclaim — only the owner can reset a claim.
5. Race condition: if two gift-givers claim simultaneously, first write wins.

### 6.7 Items I've Claimed

- Accessible at `/gifts-giving` via nav
- Fetches all `wishlist_items` where `claimed_by = currentUserId`
- Grouped by wishlist owner with avatar, name, and item count
- Each item shows image, name, brand, price, note, and purchase link
- Unclaim button (✕) removes the claim and returns the item to available on the owner's list

### 6.8 Username setup (first sign-in)

- Triggered when `username` starts with `user-` (auto-generated temp value)
- Collects: display name (pre-filled from Google) and username
- Real-time availability check via API (debounced 500ms)
- Username validation: lowercase letters, numbers, hyphens; 3–30 characters
- On confirm, updates both fields and refreshes session

---

## 7. UX requirements

- Paste-to-add flow must complete within 3 seconds (P95).
- App must be fully usable on a 375px mobile viewport.
- Mobile nav uses a hamburger menu (☰) revealing a full dropdown.
- Desktop nav shows horizontal tabs.
- Non-connected visitors must see a clear message — not a blank page or error.
- Claimed status must update without a full page reload.
- Image failures must fall back to 🎁 emoji — no blank spaces.
- Owner must never see claimed status anywhere in the app (wishlist page, profile page, share page).

---

## 8. Data model

| Entity | Key fields | Notes |
|---|---|---|
| User | id, email, username, display_name, avatar_url, share_token | `share_token` is a random hex string generated at account creation; `username` starts as `user-{timestamp}` until setup |
| Connection | id, requester_id, recipient_id, status, created_at, updated_at | Status enum: pending / connected. Declined requests deleted. |
| WishlistItem | id, user_id, name, brand, price_display, image_url, product_url, note, position, claimed, claimed_at, claimed_by | `claimed_by` stores claimer's user_id but is never returned to the item owner |
| ScrapeLog | id, user_id, url, domain, success, fields_found, error_message, created_at | Every scrape attempt logged for failure rate analysis |

---

## 9. Success metrics

| Metric | Target | Measurement |
|---|---|---|
| Connection request sent rate | >50% of new users send at least one request in first session | Connection request events / new user |
| Connection acceptance rate | >60% of pending requests are accepted | Accepted / total requests |
| Items added per active user | ≥ 1 within first session | WishlistItem count per user_id |
| Share link copy rate | >25% of users who add ≥ 1 item copy their share link | Copy share URL event / user with items |
| Claim rate | >10% of connections result in at least one claim | Claim events / connected visitor sessions |
| Scrape success rate | >60% of URL submissions return at least a name and price | ScrapeLog success aggregate |

---

## 10. Technical decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scraping approach | Shopify JSON API (Tier 1) + OG tag fetch (Tier 2) | Free; Shopify covers most DTC/beauty brands; OG covers the rest |
| Third-party metadata API | Deferred | Costs ~$19/mo; revisit if scrape failure rate exceeds threshold |
| claimed_by visibility | Never returned to owner | Preserves gift surprise; owner can reset without knowing identity |
| Public share URL | Random token, not username | Prevents guessing; unrelated to profile URL |
| Auth | Service role Supabase client + session checks in API | RLS `auth.uid()` is null with service role; all access control in code |
| Mobile nav | Hamburger menu | Three nav items too wide for mobile horizontal nav |
| Price storage | Display string (e.g. "$45") | Scraped prices are unreliable numerically; informational only |

---

## 11. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scraping fails for major retailers (Amazon, Best Buy) | High | Medium | Manual entry always available; scrape failure is friction not breakage; Microlink (~$19/mo) available if failure rates warrant |
| Price scraped is stale by purchase time | Medium | Low | Price shown as informational only; "check current price" implied by linking to product URL |
| Users expect multiple lists | Medium | Low | Single list is MVP constraint; fast-follow in next phase |

---

## 12. Phasing & roadmap

| Phase | Scope | Status |
|---|---|---|
| MVP | Social graph, single wishlist, URL paste-to-add, connections-only visibility, public share link, claim tracking, Items I've Claimed | ✅ Shipped |
| Next | Notifications (claim alerts, connection requests), settings page (edit username, display name) | Planned |
| Future | AI gift suggestions based on community wishlist data | Planned |
