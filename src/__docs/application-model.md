# TeamStore Application Model

## Purpose

This document defines the vision, architecture, and guiding principles behind TeamStore.

It exists to answer one simple question:

> **Why was TeamStore built this way?**

As the application grows, this document should remain the source of truth for architectural decisions and business concepts.

---

# Vision

TeamStore is a modern self-service platform that enables organizations to create and manage branded online stores.

The goal is to make launching a team store as simple as possible while maintaining a scalable architecture capable of supporting thousands of organizations and stores.

TeamStore is designed to grow from a coach creating their first store into a platform supporting organizations with multiple stores, multiple administrators, and future marketplace capabilities.

---

# Goals

- Build a fast, modern React application.
- Keep the user experience simple and intuitive.
- Minimize the number of steps required to launch a store.
- Separate temporary application state from persisted data.
- Design an architecture that scales without becoming overly complex.
- Favor readability and maintainability over clever implementations.

---

# Core Principles

## Simplicity Over Cleverness

Code should be easy to understand.

If two approaches solve the same problem, prefer the one that is easier to read six months from now.

---

## Readability First

Future developers should understand the code without needing extensive documentation.

Clear architecture is more valuable than clever code.

---

## Single Responsibility

Every component should have one responsibility.

Examples:

- Context manages draft state.
- Components render UI.
- Convex persists data.
- Services perform business logic.

---

## Build for Growth

Avoid overengineering.

However, make architectural decisions that prevent major rewrites as TeamStore grows.

---

# Business Model

The most important architectural decision is separating **Organizations**, **Users**, and **Stores**.

```
Organization
      │
      ├── Members
      └── Stores
```

Organizations own Stores.

Users belong to Organizations.

Stores contain business data.

---

# Why Organizations?

Initially it may appear simpler for Users to own Stores directly.

```
User
   │
owns
   ▼
Store
```

However, this creates problems when:

- Ownership changes
- Multiple people manage a store
- Organizations have multiple stores
- Permissions are introduced
- Billing becomes shared

Instead, Organizations own Stores.

```
Organization
      │
      ├── Users
      └── Stores
```

This provides significantly more flexibility while keeping the application simple.

---

# What Is an Organization?

An Organization is **not** necessarily a school.

It simply represents the account that owns one or more stores.

Examples:

- Coach Smith Athletics
- Jaguars Football
- Springfield Booster Club
- City Soccer Association
- Dance Academy
- Local Business

Organizations are intentionally generic.

---

# What Is a User?

A User represents an individual person.

Examples:

- Coach
- Athletic Director
- Booster Club Member
- Parent
- Team Manager

Users belong to Organizations.

---

# What Is a Store?

A Store is an individual shopping experience.

Examples:

- Football Store
- Basketball Store
- Wrestling Store
- Youth Camp Store

Each Store has its own:

- Branding
- Products
- Orders
- Customers
- Settings

Stores are independent.

---

# Data Relationships

```
Organization
    │
    ├── Users
    │
    └── Stores
            │
            ├── Products
            ├── Orders
            ├── Customers
            └── Settings
```

---

# Store Identity

Every Store contains two identifiers.

## Internal ID

Used by the application and database.

Example

```
store_01JY8WAZ9PHH5J8NQ8R7R3A5FD
```

Internal IDs never change.

---

## Public Slug

Used for routing.

Example

```
teamstore.com/store/jaguars-football
```

The slug is editable.

It must be unique.

---

# Store Creation Workflow

A Store is **not** created immediately.

Instead, the wizard builds a draft using React Context.

```
Create Store Wizard

↓

React Context

↓

Review

↓

Create Store

↓

Convex

↓

Store Created
```

Benefits:

- No abandoned stores
- Faster user experience
- Single database transaction
- Easier validation
- Simpler architecture

---

# Application State

Temporary state belongs in React.

Persistent state belongs in Convex.

## React Context

Used for:

- Branding
- Organization information
- Logo
- Products
- Store settings

Nothing is written to the database until the user creates the store.

---

## Convex

Used for persisted data.

Examples:

- Organizations
- Users
- Stores
- Products
- Orders
- Customers

---

# Routing

Examples:

```
/
/stores
/store/:slug
/product/:sku
/dashboard
/account
```

Store URLs use human-readable slugs.

Application logic uses immutable IDs.

---

# Future Expansion

This architecture supports future features without requiring major redesigns.

Examples:

- Multiple stores per organization
- Multiple administrators
- Invitations
- Role-based permissions
- Shared billing
- Store analytics
- AI-assisted branding
- Marketplace search
- Organization dashboards

---

# Why We Chose This Model

## Organizations Own Stores

**Reason**

Organizations are more stable than individual users.

Users may leave an organization.

Stores should continue to exist regardless of who currently manages them.

---

## Store Drafts Use React Context

**Reason**

Users frequently abandon multi-step forms.

Saving drafts only in memory prevents incomplete records from being written to the database.

The final Store is created only after the user explicitly completes the wizard.

---

## Human-Readable URLs

**Reason**

Readable URLs improve usability and searchability.

Immutable IDs provide reliable internal references.

Both are necessary because they solve different problems.

---

## React + Convex

**Reason**

React provides an excellent user experience for building the wizard.

Convex provides real-time persistence once the Store has been created.

Keeping those responsibilities separate simplifies the application.

---

# Guiding Philosophy

TeamStore is built around a simple idea:

> **Create a platform that is easy for first-time users, while designing an architecture capable of supporting future growth.**

Every architectural decision should support that goal.

If a proposed feature makes the application significantly more complicated without providing meaningful value to users, it should be reconsidered.
