# Accessibility Features

This application implements comprehensive accessibility features following WCAG 2.1 AA standards.

## Features Implemented

### 1. Keyboard Navigation

- **Full keyboard support** throughout the application
- All interactive elements are keyboard accessible
- Logical tab order for all pages
- Keyboard shortcuts for common actions:
  - `Escape`: Close modals/dialogs
  - `Enter`: Activate buttons/links
  - `Arrow keys`: Navigate within components
  - `Space`: Toggle checkboxes/switches
  - `Tab/Shift+Tab`: Navigate between focusable elements

### 2. Focus Indicators

- **Visible focus indicators** on all interactive elements
- 3px solid outline with 2px offset for better visibility
- WCAG AA compliant contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Custom focus styles for buttons, links, form inputs, and icons

### 3. ARIA Labels and Roles

- All interactive elements have proper `aria-label` attributes
- Icons have descriptive labels for screen readers
- Form fields include `aria-describedby` for error messages and help text
- `aria-invalid` and `aria-required` attributes on form inputs
- Proper role attributes (`role="main"`, `role="navigation"`, etc.)

### 4. Screen Reader Support

- **Live regions** for dynamic content updates
- Screen reader announcements for:
  - Form validation errors
  - Success/error messages
  - Page navigation changes
  - Loading states
- `aria-live` regions with appropriate politeness levels
- Hidden text for screen readers using `.sr-only` class

### 5. Color Contrast

- All color combinations meet WCAG 2.1 AA standards
- Primary colors adjusted for better contrast:
  - Light mode: Darker blues and purples
  - Dark mode: Lighter, more saturated colors
- Error states use high-contrast red
- Text maintains minimum 4.5:1 contrast ratio

### 6. Focus Trap in Modals

- Keyboard focus is trapped within modal dialogs
- `Tab` cycles through focusable elements within the modal
- `Escape` closes the modal
- Focus returns to trigger element on close
- First focusable element receives focus on open

### 7. Skip-to-Content Link

- Skip link appears at the top of the page on keyboard focus
- Allows keyboard users to bypass navigation
- Scrolls smoothly to main content area
- Visible only when focused

### 8. Text Resize Support

- Font sizes use relative units (`rem`, `em`)
- `clamp()` CSS function for responsive typography
- Layout maintains integrity up to 200% text zoom
- No horizontal scrolling required
- Line heights optimized for readability (1.5 minimum)

### 9. Reduced Motion Support

- Respects `prefers-reduced-motion` media query
- Animations disabled for users who prefer reduced motion
- Smooth scrolling can be disabled
- Transitions minimized when requested

## Components

### Accessibility Components

#### SkipToContent

```tsx
import { SkipToContent } from '@/components/common';

<SkipToContent targetId="main-content" />;
```

#### ScreenReaderOnly

```tsx
import { ScreenReaderOnly } from '@/components/common';

<ScreenReaderOnly>Additional context for screen readers</ScreenReaderOnly>;
```

#### LiveRegion

```tsx
import { LiveRegion } from '@/components/common';

<LiveRegion priority="polite">{statusMessage}</LiveRegion>;
```

#### FocusableIconButton

```tsx
import { FocusableIconButton } from '@/components/common';

<FocusableIconButton label="Delete item">
  <DeleteIcon />
</FocusableIconButton>;
```

#### AccessibleTextField

```tsx
import { AccessibleTextField } from '@/components/common';

<AccessibleTextField label="Email" required error={!!errors.email} helperText={errors.email} />;
```

#### AccessibleButton

```tsx
import { AccessibleButton } from '@/components/common';

<AccessibleButton label="Save changes" loading={isLoading} loadingText="Saving...">
  Save
</AccessibleButton>;
```

#### AccessibleTable

```tsx
import { AccessibleTable } from '@/components/common';

<AccessibleTable
  caption="Student roster"
  columns={[
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
  ]}
>
  {/* table rows */}
</AccessibleTable>;
```

#### AccessibleModal

```tsx
import { AccessibleModal } from '@/components/common';

<AccessibleModal open={isOpen} title="Confirm Action" onClose={handleClose}>
  {/* modal content */}
</AccessibleModal>;
```

### Hooks

#### useAnnounce

```tsx
import { useAnnounce } from '@/hooks';

const announce = useAnnounce();
announce('Form submitted successfully', 'polite');
```

#### useFocusTrap

```tsx
import { useFocusTrap } from '@/hooks';

const focusTrapRef = useFocusTrap(isModalOpen);
```

#### useKeyboardNavigation

```tsx
import { useKeyboardNavigation } from '@/hooks';

useKeyboardNavigation({
  onEscape: handleClose,
  onEnter: handleSubmit,
  enabled: true,
});
```

### Utilities

#### announceToScreenReader

```tsx
import { announceToScreenReader } from '@/utils';

announceToScreenReader('Item added to cart', 'polite');
```

#### trapFocus

```tsx
import { trapFocus } from '@/utils';

const cleanup = trapFocus(modalElement);
// Later: cleanup();
```

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**
   - Navigate the entire app using only keyboard
   - Verify all interactive elements are reachable
   - Check focus indicators are visible

2. **Screen Reader Testing**
   - Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac/iOS)
   - Verify all content is announced properly
   - Check that dynamic updates are announced

3. **Zoom Testing**
   - Test at 200% browser zoom
   - Verify no content is cut off
   - Check that layout remains functional

4. **Color Contrast**
   - Use browser DevTools or online contrast checkers
   - Verify all text meets minimum contrast ratios

### Automated Testing Tools

- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit

## Best Practices

1. Always provide meaningful `aria-label` for icons and icon buttons
2. Use semantic HTML elements when possible
3. Ensure form inputs have associated labels
4. Provide error messages that are programmatically associated with inputs
5. Use heading hierarchy properly (h1 → h2 → h3)
6. Add alt text to all images (decorative images should have `alt=""`)
7. Ensure sufficient color contrast for all text
8. Support keyboard navigation for custom components
9. Test with actual screen readers
10. Respect user preferences for reduced motion

## WCAG 2.1 AA Compliance Checklist

- ✅ 1.1.1 Non-text Content (Level A)
- ✅ 1.3.1 Info and Relationships (Level A)
- ✅ 1.3.2 Meaningful Sequence (Level A)
- ✅ 1.4.1 Use of Color (Level A)
- ✅ 1.4.3 Contrast (Minimum) (Level AA)
- ✅ 2.1.1 Keyboard (Level A)
- ✅ 2.1.2 No Keyboard Trap (Level A)
- ✅ 2.4.1 Bypass Blocks (Level A) - Skip to content
- ✅ 2.4.3 Focus Order (Level A)
- ✅ 2.4.6 Headings and Labels (Level AA)
- ✅ 2.4.7 Focus Visible (Level AA)
- ✅ 3.1.1 Language of Page (Level A)
- ✅ 3.2.1 On Focus (Level A)
- ✅ 3.2.2 On Input (Level A)
- ✅ 3.3.1 Error Identification (Level A)
- ✅ 3.3.2 Labels or Instructions (Level A)
- ✅ 4.1.1 Parsing (Level A)
- ✅ 4.1.2 Name, Role, Value (Level A)
- ✅ 4.1.3 Status Messages (Level AA)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
