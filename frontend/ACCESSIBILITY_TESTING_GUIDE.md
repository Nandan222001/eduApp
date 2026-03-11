# Accessibility Testing Guide

## Quick Test Checklist

### ✅ Keyboard Navigation Test (5 minutes)

1. **Tab Navigation**
   - [ ] Press Tab to navigate through all interactive elements
   - [ ] Press Shift+Tab to navigate backwards
   - [ ] Verify focus indicator is visible on each element
   - [ ] Verify focus order is logical (left to right, top to bottom)

2. **Skip Link**
   - [ ] Press Tab on page load
   - [ ] Verify "Skip to main content" link appears
   - [ ] Press Enter to activate
   - [ ] Verify focus moves to main content

3. **Dialogs/Modals**
   - [ ] Open a dialog
   - [ ] Verify focus moves to first element in dialog
   - [ ] Press Tab to cycle through dialog elements
   - [ ] Verify focus stays trapped in dialog
   - [ ] Press Escape to close
   - [ ] Verify focus returns to trigger button

4. **Menus**
   - [ ] Open dropdown menu
   - [ ] Use Arrow keys to navigate items
   - [ ] Press Enter to select item
   - [ ] Press Escape to close menu

5. **Forms**
   - [ ] Tab through form fields
   - [ ] Submit form with Enter on text field
   - [ ] Verify error messages are announced

### ✅ Screen Reader Test (10 minutes)

**Tools:** NVDA (Windows), VoiceOver (Mac), JAWS (Windows)

1. **Page Structure**
   - [ ] All headings are announced correctly
   - [ ] Landmarks are identified (navigation, main, etc.)
   - [ ] Skip link is announced first

2. **Interactive Elements**
   - [ ] All buttons have meaningful labels
   - [ ] All links describe their destination
   - [ ] All form fields have labels
   - [ ] Icon buttons have aria-labels

3. **Dynamic Content**
   - [ ] Status messages are announced
   - [ ] Error messages are announced
   - [ ] Success messages are announced
   - [ ] Loading states are announced

4. **Images**
   - [ ] Meaningful images have alt text
   - [ ] Decorative images are ignored
   - [ ] Complex images have descriptions

### ✅ Visual Test (5 minutes)

1. **Color Contrast**
   - [ ] Text meets 4.5:1 contrast ratio
   - [ ] Interactive elements meet 3:1 ratio
   - [ ] Focus indicators are clearly visible
   - [ ] Use browser DevTools color picker

2. **Text Resize**
   - [ ] Zoom browser to 200% (Ctrl/Cmd + +)
   - [ ] Use accessibility toolbar to increase font
   - [ ] Verify no content is cut off
   - [ ] Verify no horizontal scrolling
   - [ ] Verify layout doesn't break

3. **High Contrast Mode**
   - [ ] Enable in accessibility toolbar
   - [ ] Verify all content is readable
   - [ ] Verify focus indicators are visible

4. **Reduced Motion**
   - [ ] Enable in accessibility toolbar
   - [ ] Verify animations are minimal
   - [ ] Verify transitions are fast

### ✅ Mobile Test (5 minutes)

1. **Touch Targets**
   - [ ] All buttons are at least 44x44px
   - [ ] Touch targets don't overlap
   - [ ] Easy to tap on mobile device

2. **Screen Reader (Mobile)**
   - [ ] Test with TalkBack (Android) or VoiceOver (iOS)
   - [ ] Swipe to navigate
   - [ ] Double tap to activate

## Detailed Testing Procedures

### Keyboard Navigation Testing

#### Test 1: Tab Order

1. Navigate to the home page
2. Press Tab repeatedly
3. Document the tab order
4. Verify it follows logical flow

Expected: Navigation → Search → Main content → Footer

#### Test 2: Focus Indicators

1. Navigate with keyboard
2. Verify each focused element has visible outline
3. Check outline color, width, and offset

Expected: 3px solid outline, 2px offset, primary color

#### Test 3: Focus Trap

1. Open any modal/dialog
2. Try to Tab outside the modal
3. Press Shift+Tab at first element

Expected: Focus stays within modal, cycles from last to first

#### Test 4: Keyboard Shortcuts

1. Press Alt+S (focus search)
2. Press / (alternate search focus)
3. Press Escape in modal (closes)
4. Press ? (show shortcuts)

Expected: All shortcuts work as documented

### Screen Reader Testing

#### Test with NVDA (Windows)

1. Download and install NVDA
2. Start NVDA (Ctrl+Alt+N)
3. Navigate to application
4. Use arrow keys to read content
5. Use Tab to jump between interactive elements
6. Listen for announcements

**Key Commands:**

- `Insert+Down Arrow`: Read all
- `H`: Jump to next heading
- `B`: Jump to next button
- `F`: Jump to next form field
- `K`: Jump to next link

#### Test with VoiceOver (Mac)

1. Enable VoiceOver (Cmd+F5)
2. Navigate to application
3. Use VO+Arrow keys to navigate
4. Use VO+Space to activate

**Key Commands:**

- `VO+A`: Read all
- `VO+H`: Jump to next heading
- `VO+J`: Jump to next form control
- `VO+L`: Jump to next link

### Automated Testing

#### Using axe DevTools

1. Install axe DevTools browser extension
2. Open application in browser
3. Open DevTools (F12)
4. Navigate to axe DevTools tab
5. Click "Scan ALL of my page"
6. Review results

Expected: 0 violations

#### Using Lighthouse

1. Open Chrome DevTools (F12)
2. Navigate to Lighthouse tab
3. Select "Accessibility" category
4. Click "Generate report"

Expected: Score of 95+

#### Using WAVE

1. Install WAVE browser extension
2. Navigate to application
3. Click WAVE icon
4. Review results

Expected: 0 errors, 0 contrast errors

### Manual Code Review

#### Check ARIA Implementation

```bash
# Search for interactive elements without ARIA
grep -r "onClick" --include="*.tsx" | grep -v "aria-label"

# Check for images without alt
grep -r "<img" --include="*.tsx" | grep -v "alt="

# Check for buttons without labels
grep -r "<IconButton" --include="*.tsx" | grep -v "aria-label"
```

#### Check Focus Management

- Review modal/dialog components for focus trap
- Verify focus restoration after modal close
- Check skip links are implemented

#### Check Color Contrast

1. Use browser DevTools color picker
2. Check contrast ratio for:
   - Body text: Minimum 4.5:1
   - Large text (18pt+): Minimum 3:1
   - UI components: Minimum 3:1

## Common Issues and Fixes

### Issue: Focus indicator not visible

**Fix:** Add `:focus-visible` styles with high contrast outline

### Issue: Keyboard trap in modal

**Fix:** Implement focus trap hook and ensure proper tab cycling

### Issue: Missing ARIA labels

**Fix:** Add `aria-label` to all interactive elements without visible text

### Issue: Screen reader not announcing updates

**Fix:** Use live regions with `aria-live="polite"` or `"assertive"`

### Issue: Poor color contrast

**Fix:** Adjust colors to meet minimum ratios, use contrast checker

### Issue: Layout breaks on zoom

**Fix:** Use relative units (rem, em), test at 200% zoom

### Issue: No keyboard access to element

**Fix:** Make element focusable with `tabIndex={0}` or use button/link

### Issue: Form errors not announced

**Fix:** Add `aria-invalid` and `aria-describedby` to fields with errors

## Testing Tools

### Browser Extensions

- **axe DevTools** - Comprehensive accessibility testing
- **WAVE** - Visual accessibility checker
- **Accessibility Insights** - Microsoft's testing tool
- **ChromeVox** - Chrome screen reader

### Screen Readers

- **NVDA** (Free, Windows) - https://www.nvaccess.org/
- **JAWS** (Paid, Windows) - https://www.freedomscientific.com/
- **VoiceOver** (Built-in, Mac/iOS)
- **TalkBack** (Built-in, Android)

### Online Tools

- **WebAIM Contrast Checker** - https://webaim.org/resources/contrastchecker/
- **Who Can Use** - https://whocanuse.com/
- **Color Oracle** - Color blindness simulator

### Command Line Tools

```bash
# Install pa11y
npm install -g pa11y

# Run accessibility test
pa11y http://localhost:3000

# Install axe-cli
npm install -g @axe-core/cli

# Run axe test
axe http://localhost:3000
```

## Continuous Testing

### Add to CI/CD Pipeline

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Run axe tests
        run: npx @axe-core/cli http://localhost:3000
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm run lint:a11y
```

## Documentation

After testing, document:

1. Test results
2. Issues found
3. Fixes applied
4. Remaining issues (if any)
5. Recommendations

## Certification

Once all tests pass:

- [ ] Keyboard navigation works perfectly
- [ ] Screen reader compatibility verified
- [ ] Color contrast meets WCAG AA
- [ ] Text resize supported to 200%
- [ ] Automated tests pass
- [ ] Manual review complete

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
