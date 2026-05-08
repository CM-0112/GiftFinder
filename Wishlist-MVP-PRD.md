# Wishlist — Product Requirements Document
**MVP** · Status: Draft · Version: 0.1 · May 2026

| | |
|---|---|
| **Status** | Draft |
| **Version** | 0.1 |
| **Date** | May 2026 |
| **Owner** | Product |
| **Reviewers** | Engineering, Design |

---

## 1. Overview

Wishlist is a lightweight feature that lets registered users curate a list of gifts they'd like to receive. A user's wishlist is visible only to their confirmed connections on the platform — people who aren't connected can find a user's profile via their username URL, but cannot see the wishlist contents.

The MVP is deliberately narrow: users add items by pasting a URL (auto-filled where possible), and connected gift-givers can mark an item as claimed to prevent duplicates. No purchase flow, no external sharing to non-users.

---

## 2. Problem statement

When someone wants to share gift ideas with friends or family, the current options are either too heavy (registries tied to a specific retailer) or too informal (a notes app screenshot sent over WhatsApp). Neither solves the duplicate problem — two people buying the same thing.

The result is awkward coordination, repeated gifts, and givers defaulting to generic safe choices.

> **Goal:** Give users a private wishlist their connections can browse — so gift-givers always know what they want, at what price, and whether it's already been claimed.

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

---

## 4. Scope — MVP

**In scope:**

- Wishlist creation and management for registered users
- Adding items by pasting a URL — name, price, and brand auto-filled from the page
- Manual override of any auto-filled field
- Optional notes field per item (e.g. "size M, in blue")
- Connections-only visibility — wishlist is visible only to confirmed connections
- Profile page visible to anyone by username URL, but wishlist content gated to connections
- Claim flow for connected gift-givers — mark an item as "I'll get this"
- Claimed items shown as unavailable to other connections (duplicate prevention)
- Wishlist owner can see which items are claimed but not who claimed them

**Out of scope for MVP:**

- Multiple wishlists per user (one list per user at launch)
- Priority or ranking of items
- Price range filtering for gift-givers
- Comments or notes from gift-givers
- Purchase links / affiliate integration
- Notifications (email or push) when an item is claimed
- Gifter accounts or identity
- Import from Amazon, Apple, or other registries
- Product catalog search
- Connection / social graph management (assumed to exist or built in parallel)

---

## 5. User stories

### 5.1 Wishlist owner

- As an owner, I can add an item by pasting a product URL so that the name, price, and brand are filled in automatically.
- As an owner, I can manually edit any auto-filled field in case the scrape is wrong or incomplete.
- As an owner, I can add a price manually for items without a URL (e.g. a local experience or handmade item).
- As an owner, I can add an optional note to an item to specify variant details like size, colour, or edition.
- As an owner, I can remove an item from my list at any time.
- As an owner, I can reorder items on my list.
- As an owner, I can copy my profile URL to share with people I want to connect with.
- As an owner, I can see which items on my list have been claimed, without seeing who claimed them.
- As an owner, I can reset a claimed item back to unclaimed if the gift-giver made a mistake or plans changed.

### 5.2 Gift-giver (connected user)

- As a gift-giver, I can browse a connected friend's wishlist when I'm logged in.
- As a gift-giver, I see a gated message (not the list contents) if I visit a profile I'm not connected to.
- As a gift-giver, I can see each item's name, brand, approximate price, and any notes left by the owner.
- As a gift-giver, I can mark an item as "I'll get this" to let other connections know it's taken.
- As a gift-giver, I can see that an item is already claimed so I don't duplicate it.
- As a gift-giver, I can follow the original product URL to purchase the item myself.

---

## 6. Feature specification

### 6.1 Adding an item via URL

The primary add flow is paste-to-add:

1. User pastes a product URL into an input field.
2. The system performs a server-side fetch of Open Graph and structured data tags, and attempts to extract: product name, brand / retailer name, price, and product image. This is free and works well for most consumer and DTC retailers.
3. Extracted fields are pre-populated in an editable form. Fields that could not be extracted are left blank with a placeholder prompting manual entry.
4. User confirms or edits, then saves. The item is added to the list.

Fallback behaviour when scraping fails or is incomplete: the form opens empty and the user enters details manually. The original URL is still saved and surfaced as the purchase link.

**Domain failure logging is required from day one.** Every failed or incomplete scrape must be logged by domain. This data will inform whether a third-party metadata API (e.g. Microlink, ~$19/mo) is worth introducing post-launch to handle JS-heavy retailers and sites with bot detection such as Amazon. The decision to add it should be driven by observed failure rates, not assumed upfront.

**Fields per item:**

| Field | Source | Required | Notes |
|---|---|---|---|
| Item name | Auto-filled from URL | Yes | Max 120 characters |
| Brand | Auto-filled from URL | No | Retailer or brand name |
| Price | Auto-filled from URL | No | Stored as display string (e.g. "$45") not a numeric value at MVP |
| Image | Auto-filled from URL | No | First OG image; hidden if none found |
| Product URL | Input by user | No | Shown to gift-givers as the purchase link |
| Owner note | Manual | No | e.g. "size M, forest green" — max 200 characters |

### 6.2 Wishlist view (owner)

The owner's view shows their full list with:

- Item cards: image, name, brand, price, note, and claim status
- Claimed items visually distinguished (e.g. greyed out with a "claimed" badge) but not hidden — owner may want to add a replacement
- Reorder via drag-and-drop
- Inline delete per item
- "Copy profile link" button accessible from the page — for sharing the username URL with people the owner wants to connect with

The owner can see that an item is claimed but cannot see the claimant's identity. This is intentional — maintaining gift surprise while preventing duplicates. The owner can reset any claimed item to unclaimed via a context menu or inline button on the item card.

### 6.3 Wishlist view (gift-giver)

The connected gift-giver's view is a read-only version of the list, accessible only to logged-in users who are confirmed connections of the owner:

- Item cards: image, name, brand, price, note
- Claimed items shown with a "someone's already getting this" label — not hidden, but clearly unavailable
- "I'll get this" button on unclaimed items; triggers the claim flow
- Tapping the item name or image opens the product URL in a new tab

### 6.4 Claim flow

The claim flow is intentionally minimal to reduce friction:

1. Gift-giver taps "I'll get this" on an unclaimed item.
2. A confirmation prompt appears: "Mark this as claimed? Others will see it's taken." with Confirm / Cancel.
3. On confirm, the item is marked claimed. The claimant's user_id is not stored on the claim record — only a boolean flag and a timestamp. This preserves gift surprise for the owner.
4. The item immediately shows as claimed to all subsequent visitors.
5. Gift-givers cannot unclaim an item themselves. If a mistake is made, the wishlist owner can reset a claim from their view — the item returns to unclaimed and becomes available to others.
6. The owner does not see who claimed the item when resetting — the action is simply "mark as unclaimed".

> **Edge case:** If two gift-givers tap "I'll get this" simultaneously, the first write wins. The second visitor sees the item flip to claimed before they can confirm.

### 6.5 Wishlist URL and access control

- Each user has a profile accessible at `/[username]`.
- The profile page is publicly visible (name, avatar, and a connection prompt) to anyone who knows the URL.
- The wishlist section of the profile is rendered only for logged-in users who are confirmed connections of the owner. All other visitors — including logged-out users and non-connected registered users — see a placeholder: "Connect with [name] to see their wishlist."
- There is no separate shareable link. Access is entirely determined by connection status.

---

## 7. UX requirements

- The paste-to-add flow must complete (scrape + form display) within 3 seconds for a typical product URL.
- The public wishlist must be fully usable on a 375px mobile viewport without horizontal scroll.
- Non-connected visitors must see a clear, non-intrusive message explaining that a connection is needed — not a blank page or an error.
- Claimed status must update without a full page reload.
- The owner's profile URL must be easy to copy and share from their settings or profile page.
- Empty state for a new user should explain the feature in one sentence and show the URL paste input immediately.

---

## 8. Data model

| Entity | Key fields | Notes |
|---|---|---|
| User | id, name, username | Username is the stable profile URL segment; one wishlist per user at MVP |
| WishlistItem | id, user_id, name, brand, price_display, image_url, product_url, note, position, claimed, claimed_at | `claimed` is a boolean; claimant identity not stored |

Gifters are registered users (connection required to view a wishlist). Claimant identity is not stored on the claim record — only the boolean flag and timestamp. No notifications in MVP; claim deletion is silent.

---

## 9. Success metrics

| Metric | Target | Measurement |
|---|---|---|
| Items added per active user | ≥ 1 within first session | WishlistItem count per user_id |
| Profile link share rate | >25% of users who add ≥ 1 item copy their profile URL | Copy profile URL event / user with items |
| Claim rate | >10% of connections result in at least one claim | Claim events / connected visitor sessions |
| Scrape success rate | >60% of URL submissions return at least a name and price | Scrape result logging |

---

## 10. Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | ~~Should the wishlist URL be based on username or a random slug?~~ Resolved: username-based profile URL (`/[username]`), but wishlist content gated to confirmed connections only. Non-connected visitors see the profile shell, not the list. | Product | **Resolved** |
| 2 | ~~Should the owner be able to reset a claim?~~ Resolved: yes, owner can reset any claim to unclaimed from their view. Gifter has no unclaim action. | Design | **Resolved** |
| 3 | ~~What scraping approach?~~ Resolved: server-side OG tag fetch only (free). Third-party metadata API fallback ruled out for MVP to keep costs at zero — domain failure logging will determine whether it's needed post-launch. Browser extension ruled out entirely. | Eng | **Resolved** |
| 4 | ~~What happens to a claimed item if the owner deletes it?~~ Resolved: gifters are registered users (required for connection). However, no claim notifications in MVP. If an owner deletes a claimed item, the claim record is also deleted silently — no notification sent. Add to Phase 2 with the broader notifications system. | Product / Eng | **Resolved** |
| 5 | ~~One wishlist per user — acceptable MVP constraint?~~ Resolved: yes. Single wishlist at launch; multi-list support fast-followed in Phase 2. | Product | **Resolved** |

---

## 11. Dependencies & risks

**Dependencies:**

- User auth — wishlist ownership requires a logged-in user
- Server-side URL scraping — server-side OG tag fetch only. No third-party API at MVP. Domain failure logging must be instrumented before launch to support a post-launch decision on whether a paid API is warranted.
- Connection / social graph system — wishlist visibility depends on a confirmed connection state between two users; this must exist or be built in parallel
- Username-based routing — profile URLs must be registered and unique at account creation

**Risks:**

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scraping fails for major retailers (bot detection, JS-heavy pages) | High | Medium | Manual entry is always available as fallback — failure is friction, not breakage. Log failure rates by domain from day one; introduce a third-party metadata API post-launch if failure rates justify the cost (~$19/mo). |
| Gift-giver claims an item by mistake with no way to undo | Medium | Medium | Add owner-side claim reset in MVP; consider a short undo window for gifters |
| Users expect multiple lists and feel constrained | Medium | Low | Set expectations clearly in onboarding; fast-follow with multi-list in Phase 2 |
| Price scraped is stale by the time the gift-giver visits | Low | Low | Display price as informational only with a "check current price" note; don't imply it's guaranteed |

---

## 12. Phasing & future roadmap

| Phase | Scope | Key unlock |
|---|---|---|
| MVP (this doc) | Single wishlist, URL paste-to-add, connections-only visibility, claim to prevent duplicates | Core gifting coordination solved |
| Phase 2 | Multiple wishlists per user, gifter notes, claim notifications, priority ordering | Richer occasion management |
| Phase 3 | Gift Finder integration — wishlists feed into gift suggestions for others | Network effects; personalized recommendations |
| Future | Purchase links / affiliate integration, browser extension for easy adds, social discovery | Monetisation and growth |
