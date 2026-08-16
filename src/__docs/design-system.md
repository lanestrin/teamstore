# TeamStore Design System

This document defines the visual language and styling standards used throughout TeamStore.

The purpose of this design system is to create a consistent, maintainable, and scalable user interface.

Every new component should follow these guidelines.

---

# Design Philosophy

TeamStore follows a modern sportswear-inspired design.

Core characteristics:

- Black, white, and red brand identity
- Clean layouts
- Premium feel
- Strong typography
- Consistent spacing
- Minimal visual noise
- Large product imagery
- Accessibility first

Whenever possible, improve consistency instead of introducing new patterns.

---

# File Structure

```text
styles/
│
├── _variables.scss
├── _mixins.scss
└── globals.scss
```

Purpose of each file:

**variables.scss**

Contains design tokens only.

Examples:

- colors
- spacing
- typography
- radius
- shadows
- transitions
- z-index
- component tokens

---

**mixins.scss**

Contains reusable styling patterns.

Examples:

- layout
- flexbox helpers
- cards
- buttons

---

**globals.scss**

Defines global browser defaults.

Examples:

- body
- typography defaults
- reset styles
- focus styles
- selection colors

Component styling should never be placed here.

---

# Design Tokens

Always use variables instead of hard-coded values.

Example

❌

```scss
background: #ffffff;
```

✅

```scss
background: $page-background;
```

---

Never create duplicate variables.

If a reusable variable already exists, use it.

---

# Colors

The application uses semantic colors instead of arbitrary hex values.

Brand

```scss
$brand-red
$brand-red-hover
$brand-red-dark
```

Neutrals

```scss
$black
$charcoal

$white
$off-white

$gray-50
...
$gray-900
```

Text

```scss
$text-primary
$text-secondary
$text-muted
$text-inverse
```

Status

```scss
$success
$success-background
$success-border

$warning
$warning-background
$warning-border
$warning-dark

$error
$error-background
$error-border

$info
$info-background
$info-border
```

Never introduce new status colors unless they represent a reusable pattern.

---

# Typography

Default body font

```scss
$font-body
```

Marketing headings

```scss
$font-heading
```

Body

```scss
$line-height-body
```

Headings

```scss
$line-height-heading
```

Letter spacing

```scss
$letter-spacing-heading
```

Use:

Inter

for body copy.

Use:

Barlow Condensed

for marketing titles.

Do not globally change heading fonts.

---

# Spacing

Always use spacing tokens.

```scss
$space-1
...
$space-9
```

For larger layout decisions prefer semantic spacing.

```scss
$section-gap

$card-gap

$form-gap

$list-gap
```

---

# Radius

Never hard-code border radius.

Use

```scss
$radius-sm
$radius-md
$radius-lg
$radius-xl

$radius-round

$radius-pill
```

Component tokens

```scss
$button-radius

$card-radius

$input-radius
```

---

# Shadows

Use

```scss
$shadow-sm

$shadow-md

$shadow-lg

$shadow-dark
```

Do not create one-off shadows unless the design specifically requires it.

---

# Buttons

Every button should use shared tokens.

Primary

```scss
$button-primary-bg
```

Secondary

```scss
$button-secondary-bg
```

Accent

```scss
$button-accent-bg
```

Buttons should use

```scss
@include button-primary @include button-secondary @include button-accent;
```

instead of redefining styles.

---

# Cards

Cards should use

```scss
@include card;
```

instead of redefining

- border
- background
- radius
- shadow

---

# Layout

Maximum page width

```scss
$container-width
```

Container layout

```scss
@include page-container;
```

Avoid manually writing

```scss
max-width
margin: 0 auto;
```

throughout the application.

---

# Flex Helpers

Instead of repeatedly writing

```scss
display: flex;
align-items: center;
justify-content: center;
```

use

```scss
@include flex-center;
```

Available helpers

```scss
@include flex-center;

@include flex-between;

@include flex-column;
```

---

# Header

The application header is part of the TeamStore brand.

Guidelines

- Black background
- White navigation
- Red hover states
- Minimal appearance
- Expandable search
- Avatar menu
- Cart icon

---

# Component Responsibilities

A component should own:

- layout
- spacing
- feature-specific styling

A component should NOT redefine:

- colors
- shadows
- typography
- spacing scale
- transitions

Those belong in the design system.

---

# Refactoring Rules

When refactoring a SCSS file:

Preserve

- layout
- responsive behavior
- accessibility
- interactions

Improve

- readability
- consistency
- reuse

Replace

- hard-coded values
- duplicate code
- repeated flex layouts

Use

- design tokens
- mixins

Shorter files are encouraged when readability improves.

---

# Adding New Tokens

Before creating a new variable ask:

Will this probably be used at least three times?

If yes:

Add it to the design system.

If not:

Keep it inside the component.

Avoid over-engineering.

The design system should remain small and easy to understand.

---

# Final Principle

The design system exists to make development easier.

A new frontend developer should understand it in less than 30 minutes.

If a variable or mixin is difficult to understand, it should probably be simplified.
