# Meta (Facebook) Pixel Implementation

## Overview

The Meta Pixel is installed site-wide and fires events for every meaningful
user action: page views, auth, browsing, cart changes, checkout, payment, and
post-purchase actions.

- **Pixel ID:** `2005773946642133`
- **Configurable via env var:** `NEXT_PUBLIC_FB_PIXEL_ID`
- **Loaded once** from the root layout, runs on every page (server-rendered
  and client-navigated).

## Architecture

```
app/layout.tsx
  └── <MetaPixel /> (client, mounted in <Suspense>)
        ├── Injects the fbq() bootstrap script (afterInteractive)
        ├── Renders the <noscript> fallback pixel
        └── Fires PageView on every client-side route change

lib/fbpixel.ts
  └── Typed helper functions (trackAddToCart, trackPurchase, etc.)
      that wrap window.fbq safely (no-op on server / before script loads)
```

Every component that needs to track an event imports its helper from
`@/lib/fbpixel`. Components never call `window.fbq` directly — this keeps
event names, parameter shapes, and currency handling consistent.

## Files added

| File | Purpose |
|---|---|
| `lib/fbpixel.ts` | All typed event helpers and the Pixel ID constant |
| `components/MetaPixel.tsx` | Script bootstrap + PageView on route change |
| `META_PIXEL.md` | This document |

## Files modified

| File | Change |
|---|---|
| `app/layout.tsx` | Mounts `<MetaPixel />` inside `<Suspense>` |
| `hooks/use-active-order.ts` | Fires AddToCart / RemoveFromCart from the single source of truth |
| `app/(auth)/login/page.tsx` | Fires Login on successful email login |
| `components/Google/GoogleLoginButton.tsx` | Fires Login or CompleteRegistration on Google auth |
| `components/account/AccountHeader.tsx` | Fires Logout on sign-out click |
| `app/(shop)/products/[slug]/product-page-client.tsx` | Fires ViewContent on mount, AddToFavourites / RemoveFromFavourites on heart toggle |
| `components/products/ProductCard.tsx` | Fires AddToFavourites / RemoveFromFavourites on heart toggle |
| `app/(shop)/search/search-page-client.tsx` | Fires Search on results |
| `app/checkout/checkout-page-client.tsx` | Fires InitiateCheckout on mount, RemoveCoupon on remove |
| `components/couponcode/couponcode.tsx` | Fires ApplyCoupon / RemoveCoupon |
| `components/checkout/ShippingMethodSelector.tsx` | Fires SelectShippingMethod |
| `components/checkout/OfflinePayment.tsx` | Fires SelectPaymentMethod + PlaceOrder on COD submit |
| `components/checkout/razorpay/RazorpayPayments.tsx` | Fires AddPaymentInfo + PlaceOrder on Pay click |
| `app/checkout/confirmation/[orderCode]/confirmation-page-client.tsx` | Fires Purchase on mount, DownloadInvoice, ContinueShopping |
| `components/cart/CartContents.tsx` | Fires UpdateCartQuantity on +/- buttons |
| `components/facet-filter/FacetFilterControls.tsx` | Fires ApplyFilter on facet change / clear |
| `app/(account)/account/addresses/addresses-page-client.tsx` | Fires AddressAction(add/edit) |
| `components/account/EditAddressCard.tsx` | Fires AddressAction(delete/setDefaultShipping) |
| `app/(account)/account/account-dashboard-client.tsx` | Fires UpdateProfile on details/phone submit |
| `components/account/ApplyLoyaltyPoints.tsx` | Fires ApplyLoyaltyPoints on apply |

## Events tracked

### Standard Meta events

These are recognised natively by Meta for Ads Manager, custom audiences, and
attribution.

| Event | When | Key parameters |
|---|---|---|
| `PageView` | Every route change | — |
| `ViewContent` | Product page mount | `content_ids`, `content_name`, `content_category`, `value`, `currency` |
| `Search` | Search results page | `search_string`, `num_items` |
| `AddToCart` | `addItemToOrder` runs (product page, cart drawer, any caller) | `content_ids`, `contents`, `value`, `currency` |
| `AddPaymentInfo` | User clicks Pay in Razorpay | `content_ids`, `value`, `currency` |
| `InitiateCheckout` | Checkout page mount (per order id) | `content_ids`, `contents`, `num_items`, `value`, `currency` |
| `Purchase` | Confirmation page mount (per order code) | `content_ids`, `contents`, `num_items`, `value`, `currency`, `order_id` |
| `CompleteRegistration` | Google sign-in when `isNewUser` is true | `registration_method`, `status` |

### Custom events

These fire as `fbq('trackCustom', ...)`. They show up in Events Manager under
"Custom events" and can be used as custom conversions.

| Event | When | Key parameters |
|---|---|---|
| `Login` | Email or Google login success | `method` (`'email'` or `'google'`) |
| `Logout` | Sign-out button click | — |
| `RemoveFromCart` | Item removed from cart | `content_ids`, `value`, `currency` |
| `AddToFavourites` | Heart toggled on (product page / product card) | `content_ids`, `content_name`, `value` |
| `RemoveFromFavourites` | Heart toggled off | `content_ids`, `content_name` |
| `ApplyCoupon` | Coupon applied | `coupon_code` |
| `RemoveCoupon` | Coupon removed | `coupon_code` |
| `ApplyLoyaltyPoints` | Loyalty points applied | `points` |
| `SelectShippingMethod` | Shipping method radio selected | `shipping_method_id`, `name` |
| `SelectPaymentMethod` | COD submitted | `payment_method_code` |
| `PlaceOrder` | Pay button click (COD or Razorpay) | `payment_method_code`, `value`, `currency`, `order_code` |
| `UpdateCartQuantity` | +/- button in cart | `lineId`, `variantId`, `quantity`, `delta` |
| `AddressAction` | Add / edit / delete / setDefaultShipping | `action` |
| `UpdateProfile` | Account details or phone form submit | `intent` |
| `ApplyFilter` | Facet checkbox change or "clear all" | `action` (`'apply'` / `'clear'`), `facets` |
| `DownloadInvoice` | Download Invoice on confirmation page | `order_code` |
| `ContinueShopping` | Navigation away from confirmation page | `source` |

## Event flow by user journey

### Browsing
1. User lands → `PageView`
2. User searches → `PageView` + `Search`
3. User filters → `ApplyFilter`
4. User opens product → `PageView` + `ViewContent`
5. User favourites product → `AddToFavourites`

### Cart
1. User clicks Add to Cart → `AddToCart`
2. User adjusts quantity → `UpdateCartQuantity`
3. User removes item → `RemoveFromCart`

### Checkout
1. User lands on checkout → `PageView` + `InitiateCheckout`
2. User applies coupon → `ApplyCoupon`
3. User selects shipping → `SelectShippingMethod`
4. User clicks Pay (Razorpay) → `AddPaymentInfo` + `PlaceOrder`
5. *(or)* User submits COD → `SelectPaymentMethod` + `PlaceOrder`
6. Order completes → confirmation page → `PageView` + `Purchase`
7. User downloads invoice → `DownloadInvoice`
8. User leaves confirmation page → `ContinueShopping`

### Account
1. User signs in (email) → `Login` (method=email)
2. User signs in (Google, existing) → `Login` (method=google)
3. User signs up (Google, new) → `CompleteRegistration` (method=google)
4. User signs out → `Logout`
5. User edits profile → `UpdateProfile`
6. User adds/edits/deletes an address → `AddressAction`

## Currency and value handling

Vendure stores monetary amounts in **minor units** (paise for INR). All
helpers in `lib/fbpixel.ts` convert to **major units** before sending to Meta
(`value / 100`), because Meta expects decimal currency (e.g., `499.00` not
`49900`). Currency defaults to `INR`.

## Configuration

### Production

The pixel ID is hard-coded as a fallback in `lib/fbpixel.ts:8`. To override
per environment, set in `.env.local` or your hosting provider:

```
NEXT_PUBLIC_FB_PIXEL_ID=2005773946642133
```

### Disabling

To disable the pixel entirely (e.g., in staging), set
`NEXT_PUBLIC_FB_PIXEL_ID=` (empty). The `<MetaPixel />` component returns
`null` when the ID is empty.

## Verifying events

1. Install the **Meta Pixel Helper** Chrome extension.
2. Open the site, click around — the extension popup will show every event
   being fired with the parameter payload.
3. Cross-check against the event tables above.
4. In **Events Manager** → **Test Events**, add your domain to see live
   events with full parameter details.

## What's intentionally not tracked

- **Pagination clicks** — pure navigation, already covered by `PageView`.
- **Carousel arrow / hero slider navigation** — produces noise, not a
  conversion signal.
- **Cart drawer open/close** — opening the drawer doesn't indicate intent
  beyond what `AddToCart` already signals.
- **Collection card clicks** — clicking a card navigates to the collection
  page, which already fires `PageView`. The card is a server component, so
  tracking would force a client-side bundle.
- **`RemoveLoyaltyPoints`** and **`CancelOrder`** — not exposed in the
  current UI flow.

## Maintenance notes

- All event helpers live in **one file** (`lib/fbpixel.ts`). When adding a
  new event, define the helper there first, then import it from the call
  site — never call `window.fbq` directly.
- `<MetaPixel />` must stay inside a `<Suspense>` boundary in the root
  layout because it uses `useSearchParams()` (Next 14 requirement).
- Helpers are safe to call **before** the pixel script loads and **on the
  server** — they no-op in both cases. No `typeof window` guards needed at
  call sites.
