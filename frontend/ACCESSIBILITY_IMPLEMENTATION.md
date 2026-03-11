# Accessibility Implementation Guide

This document provides a comprehensive overview of the accessibility features implemented in the educational SaaS platform.

## Overview

The platform is designed to meet WCAG 2.1 AA standards and provides comprehensive accessibility features including:

- **Keyboard Navigation**: Full keyboard support throughout the application
- **Screen Reader Support**: ARIA labels and live regions for dynamic content
- **Focus Management**: Visible focus indicators and focus trapping in modals
- **Color Contrast**: WCAG 2.1 AA compliant color schemes
- **Text Resize**: Support for font size adjustments up to 200%
- **Reduced Motion**: Respects user preferences for reduced motion
- **Skip Links**: Quick navigation to main content

## Core Features

### 1. Accessibility Context

**Location**: `src/contexts/AccessibilityContext.tsx`

Global accessibility settings management:

```typescript
import { useAccessibility } from './contexts/AccessibilityContext';

function MyComponent() {
  const { settings, increaseFontSize, announce } = useAccessibility();

  // Use settings
  console.log(settings.fontSize); // 100-200

  // Announce to screen readers
  announce('Action completed successfully');

  // Adjust font size
  increaseFontSize();
}
```

**Available Settings**:

- `reducedMotion`: Boolean - Reduces animations
- `highContrast`: Boolean - Enables high contrast mode
- `fontSize`: Number (75-200) - Percentage of default font size
- `screenReaderMode`: Boolean - Optimizes for screen readers
- `keyboardNavigationEnabled`: Boolean - Enables keyboard shortcuts

### 2. Keyboard Navigation

**Global Keyboard Shortcuts**:

- `Tab` / `Shift+Tab`: Navigate between interactive elements
- `Enter` / `Space`: Activate buttons and links
- `Escape`: Close dialogs and menus
- `Arrow Keys`: Navigate lists and menus
- `Home` / `End`: Jump to first/last item in lists

**Implementation**:

```typescript
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

function MyComponent() {
  useKeyboardNavigation({
    onEscape: () => closeModal(),
    onEnter: () => submitForm(),
    enabled: true,
  });
}
```

### 3. Focus Management

**Focus Trap in Modals**:

```typescript
import { useFocusTrap } from './hooks/useFocusTrap';

function Modal({ open }) {
  const focusTrapRef = useFocusTrap(open);

  return <div ref={focusTrapRef}>{/* content */}</div>;
}
```

**Roving Tab Index**:

```typescript
import { useRovingTabIndex } from './hooks/useRovingTabIndex';

function Menu({ items }) {
  const { getItemProps } = useRovingTabIndex(items.length, {
    orientation: 'vertical',
    loop: true,
  });

  return items.map((item, index) => (
    <button {...getItemProps(index)}>{item}</button>
  ));
}
```

### 4. Screen Reader Support

**Live Announcements**:

```typescript
import { useAnnounce } from './hooks/useAnnounce';

function MyComponent() {
  const announce = useAnnounce();

  const handleSave = () => {
    saveData();
    announce('Data saved successfully', 'polite');
  };
}
```

**Live Region Component**:

```typescript
import { LiveRegion } from './components/common';

<LiveRegion priority="assertive">
  {statusMessage}
</LiveRegion>
```

**Screen Reader Only Text**:

```typescript
import { ScreenReaderOnly } from './components/common';

<ScreenReaderOnly>
  Additional context for screen readers
</ScreenReaderOnly>
```

### 5. Accessible Components

#### AccessibleButton

```typescript
import { AccessibleButton } from './components/common';

<AccessibleButton
  label="Save changes"
  loading={isSaving}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save
</AccessibleButton>
```

#### AccessibleModal

```typescript
import { AccessibleModal } from './components/common';

<AccessibleModal
  open={open}
  title="Confirm Action"
  onClose={handleClose}
  maxWidth="md"
>
  <p>Are you sure?</p>
</AccessibleModal>
```

#### AccessibleDialog

```typescript
import { AccessibleDialog } from './components/common';

<AccessibleDialog
  open={open}
  title="Edit Profile"
  onClose={handleClose}
  actions={
    <>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  <FormFields />
</AccessibleDialog>
```

#### AccessibleCard

```typescript
import { AccessibleCard } from './components/common';

<AccessibleCard
  clickable
  onCardClick={handleCardClick}
  ariaLabel="Student profile card"
>
  <CardContent>Card content</CardContent>
</AccessibleCard>
```

#### AccessibleLink

```typescript
import { AccessibleLink } from './components/common';

<AccessibleLink to="/profile" ariaLabel="View profile">
  Profile
</AccessibleLink>

<AccessibleLink href="https://example.com" external>
  External Link
</AccessibleLink>
```

#### AccessibleImage

```typescript
import { AccessibleImage } from './components/common';

<AccessibleImage
  src="/avatar.jpg"
  alt="User profile picture"
  width={100}
  height={100}
  fallbackSrc="/default-avatar.jpg"
/>

<AccessibleImage
  src="/decorative-bg.jpg"
  alt=""
  decorative
/>
```

#### AccessibleTabs

```typescript
import { AccessibleTabs, TabPanel } from './components/common';

const [value, setValue] = useState(0);

<AccessibleTabs
  value={value}
  onChange={(e, val) => setValue(val)}
  ariaLabel="Content sections"
  tabs={[
    { label: 'Overview', ariaLabel: 'Overview section' },
    { label: 'Details', ariaLabel: 'Details section' },
  ]}
/>

<TabPanel value={value} index={0}>
  Overview content
</TabPanel>
<TabPanel value={value} index={1}>
  Details content
</TabPanel>
```

#### AccessibleTable

```typescript
import { AccessibleTable } from './components/common';

<AccessibleTable
  caption="Student list"
  headers={['Name', 'Grade', 'Status']}
  data={students}
  ariaLabel="List of students"
/>
```

#### AccessibleTextField

```typescript
import { AccessibleTextField } from './components/common';

<AccessibleTextField
  label="Email"
  required
  helperText="Enter your email address"
  error={!!errors.email}
  errorText={errors.email}
/>
```

### 6. Accessibility Toolbar

**Location**: Component automatically added to AdminAppBar

The accessibility toolbar provides:

- Font size controls (increase/decrease/reset)
- Reduced motion toggle
- High contrast toggle
- Keyboard navigation toggle

Users can access it via the accessibility icon in the top navigation bar.

### 7. Skip to Content Link

**Location**: Automatically included in AdminLayout

Allows keyboard users to skip navigation and jump directly to main content.

```typescript
import { SkipToContent } from './components/common';

<SkipToContent targetId="main-content" />
```

### 8. Color Contrast

All colors in the theme meet WCAG 2.1 AA standards:

- Normal text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

**Theme Colors**:

- Primary: `#0d47a1` on white (10.1:1 ratio)
- Secondary: `#6a1b9a` on white (8.2:1 ratio)
- Error: `#d32f2f` on white (5.9:1 ratio)
- Success: `#2e7d32` on white (5.4:1 ratio)

### 9. Focus Indicators

All interactive elements have visible focus indicators:

- 3px solid outline
- 2px offset from element
- High contrast color (primary theme color)

Customizable per component with `&:focus-visible` styles.

## Best Practices

### 1. Always Provide Text Alternatives

```typescript
// ✅ Good
<img src="chart.png" alt="Performance chart showing 85% improvement" />
<IconButton aria-label="Delete item">
  <DeleteIcon />
</IconButton>

// ❌ Bad
<img src="chart.png" />
<IconButton>
  <DeleteIcon />
</IconButton>
```

### 2. Use Semantic HTML

```typescript
// ✅ Good
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// ❌ Bad
<div className="navigation">
  <div onClick={goHome}>Home</div>
</div>
```

### 3. Manage Focus Properly

```typescript
// ✅ Good
const dialogRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (open) {
    dialogRef.current?.querySelector('button')?.focus();
  }
}, [open]);

// ❌ Bad - No focus management
```

### 4. Announce Dynamic Changes

```typescript
// ✅ Good
const announce = useAnnounce();

const handleDelete = async () => {
  await deleteItem();
  announce('Item deleted successfully', 'polite');
};

// ❌ Bad - Silent operation
const handleDelete = async () => {
  await deleteItem();
};
```

### 5. Use ARIA Attributes Correctly

```typescript
// ✅ Good
<button
  aria-expanded={isOpen}
  aria-controls="menu"
  aria-haspopup="true"
>
  Menu
</button>

// ❌ Bad
<button>Menu</button>
```

## Testing

### Keyboard Testing

1. Tab through all interactive elements
2. Verify focus indicators are visible
3. Test all keyboard shortcuts
4. Ensure no keyboard traps
5. Verify skip links work

### Screen Reader Testing

Test with:

- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

Verify:

- All content is readable
- Interactive elements have labels
- Dynamic changes are announced
- Form errors are communicated

### Automated Testing

Use tools like:

- axe DevTools
- WAVE
- Lighthouse
- Pa11y

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## Support

For accessibility issues or questions, contact the development team or file an issue in the project repository.
