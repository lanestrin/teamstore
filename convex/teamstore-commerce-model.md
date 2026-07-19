# TeamStore Commerce Model

## Purpose

This document is the source of truth for TeamStore's commerce architecture.

It clarifies how blank products, branded store products, campaigns, multi-store checkout, fulfillment, and store earnings work together.

This document should be reviewed before changing the Convex schema or implementing catalog, cart, order, fulfillment, or payout features.

---

# Core Business Model

TeamStore serves two customer groups:

1. **Individual buyers**
2. **Store owners**

Individual buyers can purchase blank products directly from TeamStore.

Store owners create branded products from TeamStore's shared blank-product catalog. They do not own or manage physical inventory.

TeamStore operates more like a print-on-demand platform than a marketplace where each merchant holds stock.

---

# Platform-Owned Blank Catalog

TeamStore owns one shared catalog of blank products.

Examples:

- T-shirts
- Hoodies
- Shorts
- Hats
- Jerseys
- Bags

The shared catalog consists of:

```text
products
└── productVariants
```

A product contains shared information such as:

- Name
- Description
- Category
- Images
- Provider information
- Publication status

A product variant contains the exact purchasable configuration:

- SKU
- Color
- Size
- Base product cost
- Suggested retail price
- Provider variant ID
- Availability

Blank products and variants are global. They do not belong to a store and must not contain `storeId`.

---

# Direct Blank-Product Sales

Individual buyers can purchase blank products directly from TeamStore.

The direct purchase flow is:

```text
Product
→ Product Variant
→ Cart
→ Order
→ Fulfillment
```

Direct blank-product purchases do not involve a branded store product.

---

# Store-Owned Branded Products

Organizations own stores.

Stores do not copy the shared blank catalog and do not own physical stock.

A store owner:

- Selects a blank product
- Uploads or selects artwork
- Chooses print placements
- Chooses which blank variants to offer
- Sets the retail price
- Publishes the branded product in the store

The branded product structure is:

```text
storeProducts
└── storeProductVariants
```

A `storeProduct` represents the store's branded listing.

A `storeProductVariant` connects that listing to a shared blank `productVariant` and stores the store-specific retail price.

The blank product remains the source of truth for the underlying garment and provider configuration.

---

# Store Pricing

Store owners control the retail price of their branded products.

Retail pricing belongs on the store's sellable variant because different sizes or colors may have different costs.

Example:

```text
Blank Small cost:       $10
Blank 2XL cost:         $13
Store Small price:      $22
Store 2XL price:        $26
```

The backend must enforce a minimum allowed price.

A starting formula is:

```text
minimum retail price
=
blank product cost
+ print cost
+ required platform margin
```

The store's earnings are:

```text
store earnings
=
retail price
- blank product cost
- print cost
- platform fee
```

Shipping and taxes are tracked separately and are not automatically treated as store profit.

---

# Fulfillment Model

Store owners do not own inventory.

TeamStore or a fulfillment provider produces and ships products after purchase.

For team stores, the selected fulfillment mode is:

## Consolidated Team Delivery

A store runs a campaign with an opening and closing date.

Buyer orders are collected during the campaign.

After the campaign closes:

1. Paid campaign items are gathered.
2. One fulfillment batch is created.
3. The batch is submitted for production.
4. One consolidated shipment is sent to the coach or designated store recipient.
5. The coach distributes products to individual players or buyers.

The campaign structure is:

```text
storeCampaigns
└── campaignProducts
```

The fulfillment structure is:

```text
fulfillmentBatches
```

A campaign should include:

- Store ID
- Name
- Start date
- End date
- Coach shipping address
- Status
- Fulfillment mode

A fulfillment batch should include:

- Campaign ID
- Store ID
- Shipping address
- Provider batch ID
- Tracking information
- Fulfillment status

---

# Buyer and Player Identification

For consolidated delivery, every store order item must retain enough information for the coach to distribute the shipment.

At minimum, store order items should snapshot:

- Buyer name
- Player or recipient name
- Product name
- Size
- Color
- Quantity
- SKU

Optional fields may include:

- Team name
- Jersey number
- Grade
- Player notes

---

# Multi-Store Cart and Checkout

A buyer can purchase products from multiple stores and from the main TeamStore catalog in one checkout.

Example:

```text
One buyer checkout
├── TeamStore blank item
├── Jaguars Football Store item
└── Tigers Basketball Store item
```

The buyer makes one payment.

Internally, the order is split into groups by sales channel, store, and campaign.

The order structure is:

```text
orders
├── orderGroups
│   └── orderItems
```

## Orders

An `order` represents the buyer's single checkout and payment.

It must not contain one required `storeId`, because the checkout may contain products from many stores.

## Order Groups

An `orderGroup` represents one fulfillment and financial group.

Examples:

- Main TeamStore direct catalog
- Jaguars Store campaign
- Tigers Store campaign

A store order group should snapshot:

- Store ID
- Organization ID
- Campaign ID
- Fulfillment mode
- Shipping amount
- Tax amount
- Store earnings
- Fulfillment status
- Payout status

## Order Items

Every order item belongs to an order group.

Order items should snapshot:

- Product and variant identifiers
- Store product identifiers when applicable
- Product name
- SKU
- Color
- Size
- Quantity
- Retail price
- Blank-product cost
- Print cost
- Platform fee
- Store earnings
- Buyer or player distribution information

Historical order values must not be recalculated from current catalog prices.

---

# Store Profit and Payout Attribution

Store earnings must be calculated and stored at checkout.

Each store item must retain an immutable earnings snapshot.

Store earnings are attributed to:

- The specific store for reporting
- The owning organization for payout

Organizations own stores, so payouts belong to the organization even if individual administrators change.

One buyer checkout may therefore create earnings for several stores and organizations.

Example:

```text
Order
├── Jaguars Store earnings: $18
├── Tigers Store earnings: $11
└── TeamStore platform revenue
```

A payout ledger can be added when real payouts are implemented.

Until then, order items and order groups must preserve the amounts required to calculate what each organization is owed.

---

# Inventory and Availability

Stores do not own stock.

Inventory or availability belongs to the shared blank-product variant or fulfillment provider.

For the first implementation, use provider availability rather than store-specific inventory.

Do not create store inventory tables unless the business later introduces physically separate stock pools.

---

# Recommended Core Tables

## Existing identity and ownership

```text
users
organizations
organizationMembers
stores
```

## Shared platform catalog

```text
products
productVariants
```

## Store merchandising

```text
storeProducts
storeProductVariants
designs
storeProductPrints
```

## Campaigns and fulfillment

```text
storeCampaigns
campaignProducts
fulfillmentBatches
```

## Checkout and orders

```text
carts
cartItems
orders
orderGroups
orderItems
```

## Later finance features

```text
payouts
payoutItems
refunds
```

---

# Implementation Phases

## Phase 1: Direct blank-product commerce

Build:

- Shared products
- Shared product variants
- Product browsing
- Variant selection
- Cart
- Direct checkout
- Direct orders

## Phase 2: Store merchandising

Build:

- Store products
- Store product variants
- Store-controlled pricing
- Design uploads
- Print placement metadata
- Store publishing

## Phase 3: Campaign fulfillment

Build:

- Store campaigns
- Campaign product selection
- Campaign deadlines
- Consolidated fulfillment batches
- Coach shipping addresses
- Player distribution data

## Phase 4: Multi-store checkout and earnings

Build:

- Mixed-store cart
- Parent orders
- Store/campaign order groups
- Item-level earnings snapshots
- Organization payout attribution
- Refund and reversal handling

---

# Architectural Invariants

These rules should not be broken without revisiting this document.

1. Blank products and blank variants are global.
2. Stores do not own physical inventory.
3. Store products reference shared blank products.
4. Store owners control retail pricing.
5. A buyer can purchase from multiple stores in one checkout.
6. One checkout creates one parent order and multiple order groups.
7. Store earnings are calculated and snapshotted at checkout.
8. Payout ownership belongs to the organization that owns the store.
9. Consolidated team delivery is organized by campaign and fulfillment batch.
10. Historical orders must not depend on mutable current catalog data.
11. Store owners must not import or recreate the platform catalog.
12. DummyJSON or future provider imports populate the shared platform catalog only.

---

# Deferred Decisions

These should be decided later, not guessed now:

- Exact platform fee formula
- Payment processor and marketplace payout mechanism
- Refund allocation rules
- Whether payment processing fees reduce store earnings
- Whether campaign shipping is charged per buyer, absorbed by the store, or subsidized
- Whether print placement uses simple predefined locations or a full visual designer
- Provider-specific inventory and availability synchronization
- Guest checkout versus required buyer accounts

---

# Final Model

```text
Shared blank catalog
├── Direct TeamStore purchases
└── Branded store products
    ├── Store-controlled retail prices
    ├── Designs and print placements
    ├── Campaign sales windows
    └── Consolidated coach delivery

One buyer checkout
└── Multiple order groups
    ├── Separate store attribution
    ├── Separate fulfillment state
    └── Separate store earnings
```

This model supports buyer-first commerce now and store-owner print-on-demand commerce later without duplicating the blank catalog or requiring store-owned inventory.
