# Create Store Wizard Plan

> **Goal:** Build the fastest and most enjoyable team store creation experience possible.
>
> A user should be able to launch a professional TeamStore in **under 5 minutes** without feeling like they are filling out paperwork.

---

# Design Principles

## Build, Don't Fill Out Forms

The wizard should feel like the user is **building a website**, not completing an application.

Every interaction should instantly update the preview so the user feels ownership over the store.

---

## Live Preview

The preview should update in real time as the user changes:

- Team colors
- Logo
- Organization name
- Products
- Store settings

Eventually the preview should reuse the same React components used throughout the storefront.

---

## Minimal Typing

Whenever possible, replace text fields with:

- Cards
- Toggles
- Icons
- Visual selections

Typing should be kept to a minimum.

---

## Auto Save

Every step should automatically save.

Users should be able to leave and continue later without losing progress.

---

# Overall Flow

```
Welcome

↓

Choose Team Colors

↓

Organization

↓

Products

↓

Store Settings

↓

Review

↓

Publish
```

---

# Step 1 — Team Colors

This will become the personality of the entire wizard.

Instead of asking for organization information first, the user selects their school colors.

Examples:

- Green / Gold
- Blue / White
- Red / Black
- Purple / Gold

Immediately update:

- Header
- Buttons
- Progress indicator
- Links
- Preview
- Accent colors

Everything should instantly feel like **their** store.

---

# Step 2 — Organization

Collect minimal information.

- Organization Name
- Organization Type
- Sport
- Mascot
- City
- State

---

# Step 3 — Products

Large visual product cards.

Examples:

- Hoodies
- T-Shirts
- Hats
- Bags
- Jackets

Avoid long checklists.

The experience should feel similar to shopping.

---

# Step 4 — Store Settings

Configure:

- Store URL
- Opening Date
- Closing Date
- Shipping
- Fundraiser
- Required Items

---

# Step 5 — Review

Instead of reviewing a form, the user reviews their website.

Each section includes:

- Edit button
- Live preview
- Summary

---

# Publish

Celebrate the accomplishment.

Display:

- Store URL
- Visit Store
- Dashboard button
- Success animation

---

# Folder Structure

```
src/features/create-store/

│
├── components/
│   ├── LivePreview/
│   ├── ProgressSidebar/
│   ├── WizardContent/
│   └── WizardFooter/
│
├── context/
│
├── hooks/
│
├── models/
│
├── steps/
│
├── CreateStoreLayout.tsx
├── CreateStorePage.tsx
└── CreateStorePage.module.scss
```

---

# Layout

Desktop

```
+---------------------------------------------------------------+
| Sidebar | Main Content                  | Live Preview        |
|         |                               |                     |
|         |                               |                     |
|         |                               |                     |
+---------------------------------------------------------------+
| Back                      Step 1 of 5                  Next   |
+---------------------------------------------------------------+
```

Tablet

```
Sidebar

Content

Preview

Footer
```

Mobile

```
Progress

Content

Preview (collapsible)

Footer
```

Use **CSS Grid**, not Flexbox.

Suggested layout:

```scss
display: grid;
grid-template-columns: 260px minmax(0, 1fr) 360px;
```

---

# Data Model

All steps edit a single object.

```ts
StoreBuilder {
    colors
    organization
    products
    settings
}
```

Each step updates one section.

The preview simply reads from this model.

---

# Phase 1

Build only the shell.

No form fields yet.

Tasks:

- Create route
- Create layout
- Create sidebar
- Create preview
- Create footer navigation
- Responsive layout
- Navigation between steps

---

# Phase 2

Build Step 1.

Choose Team Colors.

This step establishes the theme for the remainder of the wizard.

The selected colors should instantly update:

- Header
- Buttons
- Links
- Progress
- Preview
- Cards

---

# Long-Term Vision

The Store Creation Wizard is only the beginning.

Future evolution:

```
Quick Start Wizard

↓

Store Builder

↓

Organization Dashboard
```

Eventually TeamStore should support:

- Drag-and-drop homepage builder
- Custom sections
- Theme customization
- Product management
- Orders
- Members
- Coaches
- Fundraising
- Sponsors
- Artwork approvals
- Organization management

The wizard should generate a beautiful starting point.

The Store Builder will allow complete customization later.

---

# Immediate Goal

Tomorrow's milestone:

- Create `/create-store` route
- Build the wizard layout
- Create reusable layout components
- Implement the shared StoreBuilder context
- Build the Team Colors step
- Update the live preview based on the selected colors

Only after the shell is complete should we begin implementing the individual wizard steps.
