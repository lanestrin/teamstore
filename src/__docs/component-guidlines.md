# TeamStore Component Guidelines

This document defines how components are organized, when to extract
reusable code, and how new UI should be built.

The goal is consistency and maintainability.

------------------------------------------------------------------------

# Component Philosophy

Every component should have one primary responsibility.

Prefer small, focused components over large multi-purpose components.

Compose components together instead of building monolithic files.

------------------------------------------------------------------------

# Folder Structure

    components/
    └── button/
        ├── Button.tsx
        ├── Button.module.scss
        ├── Button.test.tsx (optional)
        └── index.ts

Feature-specific components belong inside their feature folder.

Reusable components belong in `src/components`.

------------------------------------------------------------------------

# When to Create a New Component

Create a reusable component when:

-   It is used in three or more places.
-   It represents a common UI pattern.
-   It has its own styling and behavior.
-   Reusing it reduces duplication.

Do not extract components used only once unless doing so clearly
improves readability.

------------------------------------------------------------------------

# Component Size

Targets (not hard rules):

-   Ideal: under 200 lines.
-   Acceptable: under 300 lines.
-   Consider splitting above 300 lines.

Split by responsibility rather than arbitrary line count.

------------------------------------------------------------------------

# Props

Keep props focused.

Prefer explicit props over large configuration objects.

Avoid boolean explosion.

Instead of:

``` tsx
<Button primary large rounded />
```

Prefer:

``` tsx
<Button variant="primary" size="large" />
```

------------------------------------------------------------------------

# State

Keep state as close to where it is used as possible.

Lift state only when multiple components truly need to share it.

------------------------------------------------------------------------

# Custom Hooks

Create a custom hook when:

-   Logic is shared.
-   State management becomes difficult to read.
-   Multiple components duplicate behavior.

Name hooks with the `use` prefix.

Examples:

-   useCart
-   useAuth
-   useDebounce

------------------------------------------------------------------------

# Styling

Use SCSS Modules.

Always import:

``` scss
@use "../../styles/variables" as *;
@use "../../styles/mixins" as *;
```

Use the shared design system.

Avoid inline styles except for dynamic values that cannot reasonably be
expressed in CSS.

------------------------------------------------------------------------

# Accessibility

Every interactive component should:

-   Be keyboard accessible.
-   Have appropriate ARIA labels when needed.
-   Use semantic HTML.
-   Preserve visible focus.

------------------------------------------------------------------------

# Performance

Do not optimize prematurely.

Use `React.memo`, `useMemo`, and `useCallback` only when they solve a
measured problem.

------------------------------------------------------------------------

# File Naming

Components:

    ProductCard.tsx

Styles:

    ProductCard.module.scss

Hooks:

    useCart.ts

Utilities:

    formatCurrency.ts

------------------------------------------------------------------------

# Refactoring

When touching an existing component:

-   Preserve behavior.
-   Improve readability.
-   Remove duplication.
-   Use shared components where appropriate.
-   Follow the Boy Scout Rule.

------------------------------------------------------------------------

# Final Principle

A new developer should be able to open any component and quickly answer:

-   What does this component do?
-   Where does its data come from?
-   What styling system does it use?
-   Can it be reused?

If those answers are clear, the component is well designed.
