# Accessibility Quick Reference

## Component Usage Guide

### Buttons

```tsx
// Standard accessible button
<AccessibleButton
  label="Save changes"
  onClick={handleSave}
>
  Save
</AccessibleButton>

// Loading button
<AccessibleButton
  loading={isSaving}
  loadingText="Saving..."
>
  Save
</AccessibleButton>

// Icon button
<FocusableIconButton label="Delete item">
  <DeleteIcon />
</FocusableIconButton>
```

### Links

```tsx
// Internal link
<AccessibleLink to="/profile">
  View Profile
</AccessibleLink>

// External link
<AccessibleLink href="https://example.com" external>
  External Site
</AccessibleLink>

// Download link
<AccessibleLink href="/file.pdf" download>
  Download PDF
</AccessibleLink>
```

### Images

```tsx
// Standard image
<AccessibleImage
  src="/photo.jpg"
  alt="Descriptive text"
/>

// Decorative image (no alt needed)
<AccessibleImage
  src="/background.jpg"
  alt=""
  decorative
/>

// With fallback
<AccessibleImage
  src="/photo.jpg"
  alt="Description"
  fallbackSrc="/placeholder.jpg"
/>
```

### Cards

```tsx
// Clickable card
<AccessibleCard
  clickable
  onCardClick={handleClick}
  ariaLabel="Student profile"
>
  <CardContent>Content</CardContent>
</AccessibleCard>

// Interactive card with keyboard support
<AccessibleCard interactive>
  <CardContent>Content</CardContent>
</AccessibleCard>
```

### Modals & Dialogs

```tsx
// Simple modal
<AccessibleModal
  open={open}
  title="Confirm Action"
  onClose={handleClose}
>
  <p>Are you sure?</p>
</AccessibleModal>

// Dialog with actions
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
  <FormContent />
</AccessibleDialog>
```

### Tabs

```tsx
const [value, setValue] = useState(0);

<AccessibleTabs
  value={value}
  onChange={(e, val) => setValue(val)}
  ariaLabel="Navigation tabs"
  tabs={[
    { label: 'Tab 1' },
    { label: 'Tab 2' },
  ]}
/>

<TabPanel value={value} index={0}>
  Tab 1 content
</TabPanel>
<TabPanel value={value} index={1}>
  Tab 2 content
</TabPanel>
```

### Forms

```tsx
<AccessibleTextField
  label="Email"
  required
  helperText="Enter your email"
  error={!!errors.email}
  errorText={errors.email}
/>
```

### Skip to Content

```tsx
// Add at the top of your layout
<SkipToContent targetId="main-content" />

// Mark your main content
<main id="main-content" tabIndex={-1}>
  {/* Content */}
</main>
```

### Screen Reader Only Text

```tsx
<ScreenReaderOnly>Additional context for screen readers</ScreenReaderOnly>
```

### Live Announcements

```tsx
// In component
const announce = useAnnounce();

const handleSave = () => {
  saveData();
  announce('Changes saved', 'polite');
};

// Or use LiveRegion component
<LiveRegion priority="polite">{message}</LiveRegion>;
```

## Keyboard Navigation

### Focus Management

```tsx
// Trap focus in modal
const focusTrapRef = useFocusTrap(isOpen);

<div ref={focusTrapRef}>{/* Modal content */}</div>;
```

### Roving Tab Index (for lists)

```tsx
const { getItemProps } = useRovingTabIndex(items.length);

{
  items.map((item, index) => <button {...getItemProps(index)}>{item.name}</button>);
}
```

### Custom Keyboard Shortcuts

```tsx
useKeyboardNavigation({
  onEscape: () => closeModal(),
  onEnter: () => submitForm(),
  onArrowUp: () => moveToPrevious(),
  onArrowDown: () => moveToNext(),
});
```

## Accessibility Context

```tsx
import { useAccessibility } from '@/contexts/AccessibilityContext';

function MyComponent() {
  const { settings, increaseFontSize, decreaseFontSize, resetFontSize, announce } =
    useAccessibility();

  return (
    <div>
      <button onClick={increaseFontSize}>A+</button>
      <button onClick={decreaseFontSize}>A-</button>
      <button onClick={resetFontSize}>Reset</button>
    </div>
  );
}
```

## Common Patterns

### Loading States

```tsx
<AccessibleButton loading={isLoading} loadingText="Loading..." aria-busy={isLoading}>
  Load Data
</AccessibleButton>
```

### Error Messages

```tsx
<Box role="alert" aria-live="assertive">
  {error && <Alert severity="error">{error}</Alert>}
</Box>
```

### Form Validation

```tsx
<TextField
  error={!!errors.email}
  helperText={errors.email}
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>;
{
  errors.email && (
    <FormHelperText id="email-error" error>
      {errors.email}
    </FormHelperText>
  );
}
```

### Dynamic Content Updates

```tsx
const announce = useAnnounce();

useEffect(() => {
  if (dataLoaded) {
    announce('Data loaded successfully', 'polite');
  }
}, [dataLoaded, announce]);
```

## ARIA Labels Checklist

- [ ] All images have alt text
- [ ] All icon buttons have aria-label
- [ ] All form inputs have labels
- [ ] All landmarks have labels (nav, main, aside)
- [ ] All dialogs have title and description IDs
- [ ] All menus have aria-label
- [ ] All tabs have proper ARIA attributes
- [ ] All custom controls have appropriate roles

## Testing Checklist

### Keyboard

- [ ] All interactive elements are focusable
- [ ] Focus order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Skip links work

### Screen Reader

- [ ] All content is readable
- [ ] Images have appropriate alt text
- [ ] Form labels are associated
- [ ] Error messages are announced
- [ ] Dynamic changes are announced
- [ ] Headings structure is logical

### Visual

- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus indicators are visible
- [ ] Text is resizable up to 200%
- [ ] Layout doesn't break with zoom
- [ ] Content reflows properly

## Common Mistakes to Avoid

❌ Missing alt text on images
✅ Always provide alt text (or empty string for decorative)

❌ Using divs for buttons
✅ Use semantic HTML (button, a)

❌ Missing labels on form inputs
✅ Always associate labels with inputs

❌ No keyboard support for custom controls
✅ Add keyboard handlers and proper ARIA

❌ Silent dynamic updates
✅ Announce changes to screen readers

❌ Poor color contrast
✅ Ensure minimum 4.5:1 ratio

❌ Focus indicators removed
✅ Keep visible focus indicators

❌ Opening modals without focus management
✅ Trap focus in modal and restore on close

## Resources

- Components: See `src/components/common/`
- Hooks: See `src/hooks/`
- Context: See `src/contexts/AccessibilityContext.tsx`
- Documentation: See `ACCESSIBILITY_IMPLEMENTATION.md`
