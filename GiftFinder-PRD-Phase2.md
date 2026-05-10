# Gift Finder — Product Requirements Document
**Phase 2** · Status: Draft · Version: 1 · May 2026

| | |
|---|---|
| **Status** | Draft |
| **Version** | 1 |
| **Date** | May 2026 |
| **Owner** | Product |
| **Reviewers** | Engineering, Design |

---

## 1. Overview

Phase 2 builds on the shipped MVP with four features: a home landing page, email notifications, a settings page, and a future-facing donation framework. Together these improve retention, polish the core experience, and lay the groundwork for Gift Finder's long-term vision of making gift giving effortless and generous.

**Why now:** The MVP validated the core loop — users add items, share lists, and connections claim gifts. Phase 2 focuses on three things: giving users a reason to come back (home page + notifications), giving them control over their profile (settings), and planting the seed for the platform's most ambitious feature (donations).

---

## 2. Features in scope

| Feature | Description |
|---|---|
| Home page | Logged-in landing page with product mission, trending items from community wishlist data, and quick-access CTAs |
| Email notifications | Transactional emails triggered by key events — connection requests and gift claims |
| Settings page | User-editable profile: username, display name, profile photo, and account deletion |

---

## 3. Feature 1 — Home page

### 3.1 Purpose

The home page serves two audiences simultaneously: new users who just signed up and need to understand what Gift Finder is and why it exists, and returning users who want a quick overview of activity and inspiration.

It is accessible at `/home` and is the destination after sign-in and when clicking "Gift Finder" in the top-left logo nav.

### 3.2 Mission statement section

The top of the page leads with the reason Gift Finder was built:

> *Gift giving should be joyful — not stressful. No more guessing. No more spending days deciding what to get. Gift Finder makes it easy to share what you want and give with confidence.*

This is not a marketing tagline — it's a genuine explanation of the product's purpose, shown to every user on every visit as a reminder of the value they're getting.

### 3.3 Quick-action cards

Below the mission, three action cards surface the core workflows:

| Card | CTA | Destination |
|---|---|---|
| My Wishlist | Add items or view your list | `/wishlist` |
| Connections | Find friends and accept requests | `/connections` |
| Items I've Claimed | See what you're getting people | `/gifts-giving` |

Cards show live counts (e.g. "3 items on your list", "2 pending requests") pulled from the user's data.

### 3.4 Trending section

Below the quick-actions, a "Trending on Gift Finder" section shows the most-added items across all users' wishlists.

**Data source:** Aggregate query on `wishlist_items` grouped by `name` + `brand`, ordered by count descending. Items must appear on at least 3 different users' wishlists to surface (threshold prevents single-user noise at low scale). Refreshed daily.

**Display:** A horizontal scrollable row of item cards showing image (or 🎁 fallback), name, brand, and how many people want it (e.g. "12 wishlists"). Tapping an item does nothing in Phase 2 — it is informational only. In a future phase, it could link to a purchase option.

**Privacy:** Only item name, brand, image, and aggregate count are shown. No user identity is ever surfaced in trending data.

**Empty state:** If fewer than 10 items meet the threshold (likely at early scale), the section is hidden entirely rather than showing a sparse or misleading list.

### 3.5 User stories

- As a user, I land on the home page after signing in.
- As a user, I can navigate to the home page by clicking "Gift Finder" in the top-left nav.
- As a user, I see a clear statement of why Gift Finder exists.
- As a user, I can see at a glance how many items are on my wishlist, how many connection requests are pending, and how many items I've claimed.
- As a user, I can navigate directly to any core section from the home page.
- As a user, I can browse trending items from the community to get gift ideas.

---

## 4. Feature 2 — Email notifications

### 4.1 Purpose

Email notifications close the loop on key social interactions that happen asynchronously — when someone sends you a connection request or claims one of your items. Without notifications, users must return to the app to discover these events, which reduces engagement and claim rates.

### 4.2 Notification events

| Event | Recipient | Subject line | Timing |
|---|---|---|---|
| Connection request received | The recipient of the request | "[Name] wants to connect on Gift Finder" | Immediately on request send |
| Connection request accepted | The original requester | "[Name] accepted your connection request" | Immediately on accept |
| Claimed item removed | The user who claimed the item | "Heads up — an item you claimed has been removed" | Immediately on item deletion |

**Notes on each notification:**

**Connection request received** — lets the recipient know someone wants to connect so they can accept promptly without having to open the app to check.

**Connection request accepted** — closes the loop for the requester; they can now browse the acceptor's wishlist.

**Claimed item removed** — when a wishlist owner deletes an item that has been claimed, the claimer is notified so they can plan accordingly. This is the most operationally important notification: without it, a gift-giver could show up to a birthday with nothing because the item quietly disappeared. The email includes the item name and the owner's display name so the claimer knows exactly what was removed and whose list it was from. Copy: *"[Item name] has been removed from [Name]'s wishlist. You may want to choose something else from their list."* Includes a direct link to the owner's wishlist.

### 4.3 Email design

- Plain, minimal design consistent with the Gift Finder brand (dark, clean)
- Each email includes a single clear CTA button linking back to the relevant section of the app
- Footer includes an unsubscribe link — users can opt out of all notifications
- Sent from a Gift Finder branded address (e.g. `hello@giftfinder.app`)

### 4.4 Technical approach

Email delivery via **Resend** (free tier: 3,000 emails/month, 100/day) — sufficient for early scale and integrates cleanly with Next.js API routes. No template engine required; emails are rendered as React components using `react-email`.

### 4.5 Opt-out

- Users can unsubscribe via a link in every email
- Unsubscribe sets a `notifications_email` boolean to `false` on the user record
- No in-app notification preferences UI in Phase 2 — email unsubscribe only

### 4.6 User stories

- As a user, I receive an email when someone sends me a connection request.
- As a user, I receive an email when someone accepts my connection request.
- As a user, I receive an email when one of my wishlist items is claimed — without learning which item or who claimed it.
- As a user, I can unsubscribe from all email notifications via a link in any email.

---

## 5. Feature 3 — Settings page

### 5.1 Purpose

The MVP has no way for users to update their profile after the initial setup screen. Settings gives users ongoing control over how they appear to connections.

### 5.2 Accessible at

`/settings` — linked from the user avatar dropdown in the nav (replacing the removed "View my profile" link).

### 5.3 Fields

| Field | Type | Validation | Notes |
|---|---|---|---|
| Display name | Text input | Max 60 characters, required | Shown to connections across the app |
| Username | Text input | 3–30 chars, lowercase letters/numbers/hyphens, unique | Real-time availability check; changing username updates profile URL |
| Profile photo | Image upload | Max 5MB, JPG/PNG/WEBP | Stored in Supabase Storage; replaces Google avatar |
| Delete account | Destructive action | Confirmation required | Deletes all user data including wishlist items, connections, and claims |

### 5.4 Username change behaviour

Changing a username immediately updates the profile URL (`/[username]`). Any existing share links (`/share/[token]`) remain valid — they are token-based and independent of username.

### 5.5 Profile photo

- User can upload a photo from their device
- Displayed as their avatar across the app (nav, connections list, profile page, share page)
- If no photo is uploaded, falls back to the Google avatar, then to initials
- Stored in a private Supabase Storage bucket; served via signed URL

### 5.6 Account deletion

- Requires two-step confirmation: "Delete account" button → confirmation modal with typed acknowledgement or secondary confirm button
- On deletion: all wishlist items, connections, claims, scrape logs, and the user record are deleted
- If the user had claimed items on others' wishlists, those claims are reset (item returns to unclaimed)
- Session is invalidated immediately after deletion

### 5.7 User stories

- As a user, I can navigate to settings from the avatar dropdown in the nav.
- As a user, I can update my display name.
- As a user, I can change my username and see real-time availability feedback.
- As a user, I can upload a profile photo to replace my Google avatar.
- As a user, I can delete my account with a confirmation step, understanding that all my data will be permanently removed.
- As a user, I understand that changing my username does not break my share link.

---

## 6. Data model additions

| Entity | New fields | Notes |
|---|---|---|
| User | `notifications_email` (boolean, default true), `profile_photo_url` (text) | `profile_photo_url` takes precedence over `avatar_url` from Google |
| Notification | New table: `id, user_id, type, read, created_at` | For future in-app notifications; email only in Phase 2 |

---

## 7. UX requirements

- Home page must load in under 2 seconds including trending data.
- Trending section must be hidden if fewer than 10 qualifying items exist — no empty or sparse states.
- Settings changes (display name, username) must show success/error feedback inline without a full page reload.
- Profile photo upload must show a preview before saving.
- Account deletion confirmation must require an explicit action (not just a single click).
- Email notifications must be delivered within 60 seconds of the triggering event.
- All unsubscribe links must work without requiring the user to be logged in.

---

## 8. Success metrics

| Metric | Target | Measurement |
|---|---|---|
| Home page engagement | >40% of sessions include a visit to the home page | Page view events |
| Email open rate | >30% open rate on notification emails | Resend analytics |
| Notification-driven return | >20% of notification email recipients open the app within 24h of receiving it | UTM-tagged email links |
| Claimed item removal action rate | >40% of users who receive a removed-item notification visit the owner's wishlist within 48h | UTM-tagged email links |
| Account deletion rate | <2% of users delete their account | Deletion events / total users |

---

## 9. Dependencies & risks

**Dependencies:**
- Resend account and domain verification for email sending
- Supabase Storage bucket for profile photo uploads
- `react-email` for email template rendering
- Triggered email on item deletion — requires the delete API route to check for active claimers before removing the record

**Risks:**

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Trending section is empty at early scale | High | Low | Hide section entirely below threshold; show once data is sufficient |
| Resend free tier (100/day) exceeded at scale | Medium | Medium | Monitor volume; upgrade to paid (~$20/mo) when needed |
| Profile photo uploads slow on mobile | Medium | Low | Compress client-side before upload; set 5MB hard limit |
| Username change breaks user expectations about their profile URL | Low | Medium | Clear messaging in settings: "Your share link won't change" |
| Email triggered on item deletion adds latency to delete action | Low | Low | Fire email asynchronously — don't block the UI on email delivery |

---

## 10. Phasing & roadmap

| Phase | Scope | Status |
|---|---|---|
| MVP | Social graph, wishlist, public share link, claim tracking, Items I've Claimed | ✅ Shipped |
| Phase 2 (this doc) | Home page, email notifications, settings page | 🔲 Planned |
| Phase 3 | AI gift suggestions — based on community wishlist data + proactive recommendations ("X item isn't on the list but we think they'd love it") | 🔲 Future |
| Phase 4 | Donation feature — anonymous and identified gift purchases without address exposure | 🔲 Future |
