# Accessibility Patterns

> General accessibility concepts and WCAG guidelines. For framework-specific implementations see:
> - [React Accessibility](../framework/react/patterns/ACCESSIBILITY.md) - Focus trap, ARIA patterns
> - [Angular Accessibility](../framework/angular/patterns/ACCESSIBILITY.md) - CDK A11y, LiveAnnouncer

## WCAG Principles (POUR)

| Principle | Description | Examples |
|-----------|-------------|----------|
| Perceivable | Content available to senses | Alt text, captions, color contrast |
| Operable | UI navigable by all | Keyboard nav, focus management |
| Understandable | Content clear and predictable | Clear labels, consistent UI |
| Robust | Works with assistive tech | Valid HTML, ARIA when needed |

## Semantic HTML First

### Use Native Elements

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| \<div onclick>\ | \<button>\ |
| \<span class="link">\ | \<a href>\ |
| \<div class="input">\ | \<input>\ |
| Custom checkbox div | \<input type="checkbox">\ |

### Landmark Regions

\\\html
<header role="banner">...</header>
<nav role="navigation">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>
\\\

## Keyboard Navigation

### Focus Requirements

- All interactive elements focusable
- Visible focus indicator
- Logical tab order
- No keyboard traps

### Key Bindings

| Key | Action |
|-----|--------|
| Tab | Move to next focusable |
| Shift+Tab | Move to previous |
| Enter/Space | Activate button/link |
| Escape | Close modal/dropdown |
| Arrow keys | Navigate within components |

## ARIA Guidelines

### When to Use ARIA

1. First: Use semantic HTML
2. Then: Add ARIA only when HTML isn't enough
3. Never: Override native semantics unnecessarily

### Common ARIA Patterns

| Pattern | Required ARIA | Purpose |
|---------|--------------|---------|
| Modal | \ole="dialog"\, \ria-modal\ | Identify dialog |
| Tab panel | \ole="tablist/tab/tabpanel"\ | Tab interface |
| Dropdown | \ria-expanded\, \ria-haspopup\ | Show state |
| Loading | \ria-busy\, \ria-live\ | Announce state |

## Form Accessibility

### Label Association

Every input needs a label:
\\\html
<!-- Explicit -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Implicit -->
<label>
  Email
  <input type="email" />
</label>
\\\

### Error Handling

- Link errors to fields: \ria-describedby\
- Mark invalid fields: \ria-invalid="true"\
- Announce errors: \ole="alert"\

### Required Fields

\\\html
<label for="name">
  Name
  <span aria-hidden="true">*</span>
  <span class="sr-only">(required)</span>
</label>
<input id="name" aria-required="true" />
\\\

## Live Regions

Announce dynamic content changes:

| Attribute | Use Case |
|-----------|----------|
| \ria-live="polite"\ | Non-urgent updates (toast) |
| \ria-live="assertive"\ | Urgent announcements (error) |
| \ole="status"\ | Status messages |
| \ole="alert"\ | Important alerts |

## Color & Contrast

### Minimum Contrast Ratios

| Element | Ratio | WCAG Level |
|---------|-------|------------|
| Normal text | 4.5:1 | AA |
| Large text (18px+) | 3:1 | AA |
| UI components | 3:1 | AA |
| Enhanced | 7:1 | AAA |

### Don't Rely on Color Alone

- Add icons to status indicators
- Use patterns in charts
- Underline links (or other non-color indicator)

## Screen Reader Support

### Hide Decorative Content

\\\html
<!-- Icon-only button -->
<button aria-label="Close">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Decorative image -->
<img src="decoration.svg" alt="" role="presentation" />
\\\

### Screen Reader Only Text

For content only screen readers need:
\\\css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
\\\

## Testing Checklist

### Automated
- [ ] axe-core / Lighthouse audit
- [ ] HTML validation
- [ ] Color contrast checker

### Manual
- [ ] Keyboard-only navigation
- [ ] Screen reader testing (NVDA, VoiceOver)
- [ ] Zoom to 200%
- [ ] Reduced motion mode

### Screen Readers to Test

| OS | Screen Reader |
|----|---------------|
| Windows | NVDA (free), JAWS |
| macOS/iOS | VoiceOver |
| Android | TalkBack |

## Anti-Patterns

| ❌ Avoid | ✅ Prefer |
|----------|----------|
| Div/span as buttons | Semantic \<button>\ |
| Color-only indicators | Color + icon/text |
| Removing focus outline | Custom visible focus |
| \	abindex > 0\ | Natural tab order |
| Auto-playing media | User-initiated playback |
| Time limits without extension | Adjustable or no limits |
