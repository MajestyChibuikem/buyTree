# BuyTree — Page Routes

A reference for every routed page: what it is, the URL, and what access level is required.

---

## Public Pages

| Page | URL | Notes |
|------|-----|-------|
| Home | `/` | Main landing page (PureVisualsTemplate) |
| Seller Landing | `/buy-tree/become-a-seller` | Hidden marketing page for recruiting sellers |
| Login | `/login` | Email + password login |
| Signup | `/signup` | Create a new buyer account |
| Forgot Password | `/forgot-password` | Request a password reset email |
| Reset Password | `/reset-password` | Set a new password via reset link |
| Shop Storefront | `/shop/:shopSlug` | A seller's branded storefront. Replace `:shopSlug` with the seller's slug (e.g. `/shop/adaeze-fabrics`) |
| Product Detail | `/shop/:shopSlug/product/:productSlug` | A specific product on a seller's store |
| Cart | `/cart` | Shopping cart — accessible to guests and logged-in users |

---


## Authenticated (any logged-in user)

These pages redirect to `/login` if you are not logged in.

| Page | URL | Notes |
|------|-----|-------|
| Checkout | `/checkout` | Review cart and enter delivery details |
| Payment Callback | `/payment/callback` | Paystack redirect after payment — do not visit directly |
| Orders | `/orders` | Order history for the logged-in buyer |
| Order Detail | `/orders/:orderId` | Details and tracking for a specific order |
| Favorites | `/favorites` | Saved/favourite products |
| Become a Seller | `/become-seller` | Apply to become a seller on BuyTree |

---

## Seller Pages

Requires login. The backend also enforces that the user is an approved seller.

| Page | URL | Notes |
|------|-----|-------|
| Seller Dashboard | `/seller/dashboard` | Overview: revenue, recent orders, quick stats |
| Seller Products | `/seller/products` | Manage product listings |
| Seller Orders | `/seller/orders` | View and manage incoming orders |
| Order Management | `/seller/order-management` | Fulfillment workflow (mark ready, in-transit, delivered) |
| Seller Analytics | `/seller/analytics` | Revenue, top products, order trends |

---

## Admin Pages

Requires login **and** `role === "admin"`. Non-admins are redirected to `/` at the router level.

| Page | URL | Notes |
|------|-----|-------|
| Admin Dashboard | `/admin/dashboard` | Platform-wide metrics |
| Admin Sellers | `/admin/sellers` | Approve, suspend, or ban sellers |
| Admin Orders | `/admin/orders` | View all orders across the platform |
| Admin Analytics | `/admin/analytics` | Platform revenue and activity analytics |

---

## Inactive / V2 Routes

These pages exist in the codebase but are **not routed** in the current build.

| Page | File | Reason |
|------|------|--------|
| StoreBrowsing | `StoreBrowsing.jsx` | V2 feature — marketplace browsing |
| Products | `Products.jsx` | V2 feature — global product listing |
| SearchResults | `SearchResults.jsx` | V2 feature — cross-store search |
| OrderHistory | `OrderHistory.jsx` | Unused — superseded by `/orders` |
| OrderDetails | `OrderDetails.jsx` | Orphan — `OrderDetail.jsx` (no "s") is the routed version |
| ComingSoon | `ComingSoon.jsx` | Was `/` placeholder, replaced by PureVisualsTemplate |

---

## How the Catch-All Works

Any unmatched URL hits the `SmartFallback` component:

- Logged in as **admin** → `/admin/dashboard`
- Logged in as **seller** → `/seller/dashboard`
- Logged in as **buyer** → `/orders`
- Not logged in → `/`
