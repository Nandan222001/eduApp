# Accessibility Quick Reference

## Components

| Component | Import | Use Case |
|-----------|--------|----------|
| `SkipToContent` | `@/components/common` | Add skip link to bypass navigation |
| `ScreenReaderOnly` | `@/components/common` | Hide visual content, visible to screen readers |
| `LiveRegion` | `@/components/common` | Announce dynamic updates to screen readers |
| `FocusableIconButton` | `@/components/common` | Icon buttons with ARIA labels |
| `AccessibleTextField` | `@/components/common` | Form inputs with full ARIA support |
| `AccessibleButton` | `@/components/common` | Buttons with loading states and ARIA |
| `AccessibleTable` | `@/components/common` | Tables with proper captions and ARIA |
| `AccessibleModal` | `@/components/common` | Modals with focus trap and ARIA |

## Hooks

| Hook | Import | Use Case |
|------|--------|----------|
| `useAnnounce` | `@/hooks` | Announce messages to screen readers |
| `useFocusTrap` | `@/hooks` | Trap focus within a container (modals) |
| `useKeyboardNavigation` | `@/hooks` | Handle keyboard shortcuts |

## Utilities

| Function | Import | Use Case |
|----------|--------|----------|
| `announceToScreenReader()` | `@/utils` | Programmatic screen reader announcements |
| `getAriaLabel()` | `@/utils` | Generate accessible labels |
| `trapFocus()` | `@/utils` | Focus trap utility |
| `getContrastRatio()` | `@/utils` | Calculate color contrast ratios |

## Quick Examples

### Skip to Content
```tsx
import { SkipToContent } from '@/components/common';

// In layout component
<SkipToContent targetId="main-content" />
<main id="main-content" tabIndex={-1}>
  {/* Content */}
</main>
```

### Screen Reader Only Text
```tsx
import { ScreenReaderOnly } from '@/components/common';

<ScreenReaderOnly>
  Additional context for screen readers
</ScreenReaderOnly>
```

### Announce to Screen Reader
```tsx
import { useAnnounce } from '@/hooks';

const announce = useAnnounce();

const handleSave = () => {
  // Save logic
  announce('Changes saved successfully', 'polite');
};
```

### Accessible Form Field
```tsx
import { AccessibleTextField } from '@/components/common';

<AccessibleTextField
  label="Email Address"
  type="email"
  required
  error={!!errors.email}
  helperText={errors.email}
  fullWidth
/>
```

### Accessible Icon Button
```tsx
import { FocusableIconButton } from '@/components/common';
import DeleteIcon from '@mui/icons-material/Delete';

<FocusableIconButton
  label="Delete item"
  onClick={handleDelete}
  color="error"
>
  <DeleteIcon />
</FocusableIconButton>
```

### Modal with Focus Trap
```tsx
import { AccessibleModal } from '@/components/common';

<AccessibleModal
  open={isOpen}
  title="Confirm Delete"
  onClose={handleClose}
>
  <p>Are you sure you want to delete this item?</p>
</AccessibleModal>
```

### Keyboard Navigation
```tsx
import { useKeyboardNavigation } from '@/hooks';

useKeyboardNavigation({
  onEscape: handleClose,
  onEnter: handleSubmit,
  onArrowUp: handlePrevious,
  onArrowDown: handleNext,
  enabled: isModalOpen
});
```

### Live Region for Updates
```tsx
import { LiveRegion } from '@/components/common';

const [status, setStatus] = useState('');

// Update status dynamically
setStatus('5 items found');

return (
  <LiveRegion priority="polite">
    {status}
  </LiveRegion>
);
```

## ARIA Attributes Reference

### Common ARIA Labels
```tsx
// Buttons
<button aria-label="Close dialog">×</button>

// Icons
<IconButton aria-label="Delete item">
  <DeleteIcon />
</IconButton>

// Forms
<input
  aria-label="Search"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="search-help"
/>
```

### ARIA Roles
```tsx
// Navigation
<nav role="navigation" aria-label="Main navigation">

// Main content
<main role="main" aria-label="Main content">

// Alerts
<div role="alert">Error message</div>

// Status updates
<div role="status" aria-live="polite">
```

### ARIA States
```tsx
// Modal
<div role="dialog" aria-modal="true">

// Loading
<button aria-busy="true">Loading...</button>

// Expanded/Collapsed
<button aria-expanded={isOpen}>Menu</button>

// Selected
<button aria-selected={isSelected}>Option</button>
```

## Focus Management

### Focus Indicators
All interactive elements have visible focus indicators:
- 3px solid outline
- 2px offset
- High contrast color

### Focus Order
Elements are focusable in logical order:
1. Skip to content link
2. Header/navigation
3. Main content
4. Sidebar
5. Footer

### Focus Trap in Modals
```tsx
import { useFocusTrap } from '@/hooks';

const focusTrapRef = useFocusTrap(isOpen);

<div ref={focusTrapRef}>
  {/* Modal content */}
</div>
```

## Color Contrast

### WCAG AA Compliant Colors

**Light Mode:**
- Primary: `#0d47a1` (contrast ratio 7.8:1)
- Secondary: `#6a1b9a` (contrast ratio 8.3:1)
- Error: `#c62828` (contrast ratio 6.2:1)
- Warning: `#e65100` (contrast ratio 5.1:1)
- Success: `#1b5e20` (contrast ratio 8.9:1)

**Dark Mode:**
- Primary: `#90caf9` (contrast ratio 5.8:1)
- Secondary: `#ce93d8` (contrast ratio 4.6:1)
- Error: `#f44336` (contrast ratio 4.8:1)
- Warning: `#ff9800` (contrast ratio 4.5:1)
- Success: `#66bb6a` (contrast ratio 4.7:1)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift + Tab` | Move to previous focusable element |
| `Enter` | Activate button or link |
| `Space` | Activate button or toggle |
| `Escape` | Close modal or cancel |
| `Arrow Keys` | Navigate within component |

## Testing Checklist

- [ ] Navigate entire page with keyboard only
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Test at 200% browser zoom
- [ ] Check color contrast with DevTools
- [ ] Verify skip link works
- [ ] Test modal focus trap
- [ ] Verify form error announcements
- [ ] Test with reduced motion enabled
- [ ] Run Lighthouse accessibility audit

## Common Issues & Solutions

### Issue: Focus not visible
**Solution:** Ensure `*:focus-visible` styles are present in CSS

### Issue: Screen reader not announcing updates
**Solution:** Use `LiveRegion` component or `useAnnounce` hook

### Issue: Modal doesn't trap focus
**Solution:** Use `useFocusTrap` hook or `AccessibleModal` component

### Issue: Icons not accessible
**Solution:** Use `FocusableIconButton` with proper `label` prop

### Issue: Form errors not announced
**Solution:** Use `AccessibleTextField` with `error` and `helperText` props

## Resources

- Full Documentation: `frontend/ACCESSIBILITY.md`
- Implementation Summary: `ACCESSIBILITY_IMPLEMENTATION_SUMMARY.md`
- Demo Page: `frontend/src/pages/AccessibilityDemo.tsx`
