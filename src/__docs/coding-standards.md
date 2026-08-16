# TeamStore Coding Standards

This document defines the coding standards for TeamStore. It focuses on
code quality, architecture, and development practices. Visual styling
standards belong in **design-system.md**.

---

# Core Principles

- Follow the Boy Scout Rule: leave every file cleaner than you found
  it.
- Optimize for readability over cleverness.
- Prefer consistency over personal preference.
- Keep solutions simple unless complexity is justified.

---

# React

- Use functional components.
- Prefer composition over inheritance.
- One component should have one primary responsibility.
- Keep state as local as possible.
- Extract custom hooks for shared logic.

---

# TypeScript

- Never use `any`.
- Prefer explicit types and interfaces.
- Keep models close to the feature that owns them.
- Use discriminated unions where appropriate.

---

# Folder Organization

Organize by feature whenever practical.

```text
src/
├── components/
├── features/
├── hooks/
├── models/
├── services/
├── styles/
└── utils/
```

---

# Naming

- Components: PascalCase
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Hooks: useSomething
- Files should match exported component names.

---

# Clean Code

- Small focused functions.
- Avoid duplicated logic.
- Prefer early returns over deeply nested code.
- Explain _why_ with comments, not _what_.

---

# Git

- One logical change per commit.
- Write descriptive commit messages.
- Keep branches focused on a single feature.

Examples:

- Add Convex authentication
- Refactor ProductCard styling
- Create reusable Button component

---

# Pull Requests

Every change should improve at least one of:

- Readability
- Maintainability
- Accessibility
- Performance
- Consistency

without degrading another area.

---

# Final Principle

Write code that another developer can confidently modify six months from
now.
