# TeamStore Form Guidelines

This document defines the standards for building forms throughout TeamStore.

The goal is consistency, maintainability, and a predictable user experience.

---

# Core Principle

Every form in TeamStore should feel like it belongs to the same application.

Users should never notice that different pages were built months apart by different developers.

---

# Responsibilities

## _forms.scss

`_forms.scss` is part of the TeamStore design system.

It is the single source of truth for native HTML form controls.

It owns:

- `.field`
- `.required`
- `.optional`
- `.helper`
- `.validationMessage`

It also owns the appearance and behavior of:

- `<input>`
- `<textarea>`
- `<select>`

Including their:

- focus state
- disabled state
- readonly state
- validation state

Do not duplicate these styles inside feature-specific SCSS files.

---

## Feature SCSS

Feature styles should only contain styles unique to that feature.

Example:

### Good

```scss
.upload {
}

.slug {
}

.productGrid {
}

.productCard {
}
```

### Bad

```scss
.field {
}

.field input {
}

.field textarea {
}
```

Those belong in `_forms.scss`.

---

# Native Controls

The following controls belong in `_forms.scss`.

## Inputs

- Text
- Password
- Email
- Number
- Search
- URL

## Textareas

All textarea styling.

## Selects

All native dropdown styling.

## Future

As they are introduced, these also belong in `_forms.scss`.

- Checkbox
- Radio
- Toggle Switch

---

# Custom Components

Custom UI components own their own styles.

Examples:

- Upload Area
- Color Picker
- Color Card
- Product Card
- Date Picker
- Image Gallery
- Rich Text Editor

Do not force these into `_forms.scss`.

---

# Validation

Validation styling should be shared.

Examples:

- Error border
- Success border
- Validation message
- Disabled state
- Readonly state

Validation should never be reimplemented inside individual features.

---

# Before Editing _forms.scss

Before adding or changing anything in `_forms.scss`, ask the following questions.

## 1.

Is this a native HTML form control?

If **No**, stop.

It probably belongs inside the feature.

---

## 2.

Will multiple pages use this?

If **No**, keep it inside the feature.

---

## 3.

Does this improve consistency across the application?

If **No**, do not add it.

---

# Decision Rule

Native HTML controls belong in `_forms.scss`.

Feature-specific components belong inside the feature.

---

# Goal

The purpose of `_forms.scss` is not to eliminate duplicate CSS.

Its purpose is to ensure every form in TeamStore behaves and feels identical.

Consistency is more valuable than saving a few lines of code.

When in doubt, optimize for readability and predictability over clever abstractions.
