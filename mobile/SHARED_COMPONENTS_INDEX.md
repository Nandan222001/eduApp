# Shared Component Library - Complete Index

## 📚 Documentation Files

| File | Description | Start Here? |
|------|-------------|-------------|
| `SHARED_COMPONENTS_QUICK_START.md` | Quick start guide with basic examples | ⭐ **START HERE** |
| `SHARED_COMPONENTS_GUIDE.md` | Comprehensive implementation guide | 📖 Read Second |
| `SHARED_COMPONENTS_EXAMPLES.tsx` | Real-world usage examples | 💡 Reference |
| `SHARED_COMPONENTS_IMPLEMENTATION.md` | Technical implementation details | 🔧 Technical |
| `SHARED_COMPONENTS_SUMMARY.md` | High-level overview | 📊 Overview |
| `SHARED_COMPONENTS_CHECKLIST.md` | Integration checklist | ✅ Testing |
| `SHARED_COMPONENTS_INDEX.md` | This file - complete index | 🗂️ Navigation |
| `src/components/shared/README.md` | Component API documentation | 📘 API Docs |

## 🎨 Theme System

### Location: `/mobile/src/theme/`

| File | Purpose |
|------|---------|
| `colors.ts` | Light and dark color palettes |
| `typography.ts` | Font sizes, weights, and text styles |
| `spacing.ts` | Spacing scale, border radius, shadows |
| `ThemeContext.tsx` | Theme provider and React Context |
| `index.ts` | Theme exports |

### Usage
```tsx
import { useTheme, ThemeProvider } from '@/theme';
```

## 🧩 Component Library

### Location: `/mobile/src/components/shared/`

### Core Components

| Component | File | Description | Key Props |
|-----------|------|-------------|-----------|
| Button | `Button.tsx` | Action button with variants | variant, size, loading, icon |
| Input | `Input.tsx` | Text input with validation | label, error, leftIcon, secureTextEntry |
| Card | `Card.tsx` | Container with elevation | elevation, padding, bordered |
| Avatar | `Avatar.tsx` | Profile photo display | uri, name, size, icon |
| Badge | `Badge.tsx` | Status indicator | label, variant, icon |
| EmptyState | `EmptyState.tsx` | Empty state placeholder | title, description, actionLabel |
| LoadingSpinner | `LoadingSpinner.tsx` | Loading indicator | size, text, fullScreen |
| RefreshControl | `RefreshControl.tsx` | Pull-to-refresh | refreshing, onRefresh |

### Advanced Components

| Component | File | Description | Key Props |
|-----------|------|-------------|-----------|
| BottomSheet | `BottomSheet.tsx` | Modal bottom sheet | snapPoints, title, onClose |
| DatePicker | `DatePicker.tsx` | Date/time picker | value, onChange, mode |
| FilePicker | `FilePicker.tsx` | File upload | onFileSelect, acceptedTypes |
| ImagePicker | `ImagePicker.tsx` | Image selection | onImageSelect, aspectRatio |
| ErrorBoundary | `ErrorBoundary.tsx` | Error boundary | fallback, onError |

### Layout Components

| Component | File | Description | Key Props |
|-----------|------|-------------|-----------|
| ScreenContainer | `ScreenContainer.tsx` | Screen wrapper | scroll, keyboardAware, padding |
| Header | `Header.tsx` | Navigation header | title, showBackButton, rightIcon |
| SectionHeader | `SectionHeader.tsx` | Section title | title, subtitle, actionLabel |

### Supporting Files

| File | Purpose |
|------|---------|
| `index.ts` | Component exports |
| `types.ts` | TypeScript type definitions |
| `README.md` | Component documentation |

## 📦 Dependencies

### Required (Already in package.json)
- `react-native-vector-icons` - Icons
- `@react-native-async-storage/async-storage` - Storage
- `react-native-safe-area-context` - SafeArea
- `react-native-gesture-handler` - Gestures
- `react-native-reanimated` - Animations
- `expo-document-picker` - File picker
- `expo-image-picker` - Image picker
- `date-fns` - Date formatting

### New (Added by this implementation)
- `@gorhom/bottom-sheet@^4.6.1` - Bottom sheet
- `@react-native-community/datetimepicker@^7.6.2` - Date picker

## 🔧 Configuration Files

| File | Changes Made |
|------|--------------|
| `package.json` | Added 2 new dependencies |
| `tsconfig.json` | Added `@theme` path alias |
| `babel.config.js` | Added `@theme` and `@services` module resolvers |

## 🛠️ Installation Scripts

| Script | Platform | Description |
|--------|----------|-------------|
| `install-shared-components.sh` | macOS/Linux | Bash installation script |
| `install-shared-components.ps1` | Windows | PowerShell installation script |

### Run Installation
```bash
# macOS/Linux
chmod +x install-shared-components.sh
./install-shared-components.sh

# Windows PowerShell
.\install-shared-components.ps1

# Or manually
npm install
```

## 📖 Quick Reference

### Import Components
```tsx
import {
  Button,
  Input,
  Card,
  Avatar,
  Badge,
  EmptyState,
  LoadingSpinner,
} from '@components/shared';
```

### Import Theme
```tsx
import { useTheme, ThemeProvider } from '@/theme';
```

### Use Theme Hook
```tsx
const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
```

### Common Patterns

#### Form
```tsx
<Card>
  <Input label="Email" leftIcon="email" />
  <Input label="Password" secureTextEntry />
  <Button title="Submit" variant="primary" fullWidth />
</Card>
```

#### List Item
```tsx
<Card>
  <View style={{ flexDirection: 'row' }}>
    <Avatar name="John Doe" />
    <View style={{ flex: 1 }}>
      <Text>John Doe</Text>
      <Badge label="Active" variant="success" />
    </View>
  </View>
</Card>
```

#### Screen Layout
```tsx
<ScreenContainer scroll keyboardAware>
  <Header title="My Screen" />
  <SectionHeader title="Content" />
  {/* Your content */}
</ScreenContainer>
```

## 🎯 Component Variants

### Button Variants
- `primary` - Primary action (default)
- `secondary` - Secondary action
- `outline` - Outlined button
- `ghost` - Text-only button
- `danger` - Destructive action

### Button Sizes
- `small` - Compact button
- `medium` - Standard button (default)
- `large` - Large button

### Badge Variants
- `default` - Neutral badge
- `primary` - Primary color
- `secondary` - Secondary color
- `success` - Success state
- `warning` - Warning state
- `error` - Error state
- `info` - Information

### Avatar Sizes
- `small` - 32x32
- `medium` - 48x48 (default)
- `large` - 64x64
- `xlarge` - 96x96

### Card Elevations
- `none` - No shadow
- `sm` - Subtle shadow
- `base` - Standard shadow (default)
- `md` - Medium shadow
- `lg` - Large shadow
- `xl` - Extra large shadow

## 🎨 Theme Values

### Colors
```tsx
theme.colors.primary
theme.colors.secondary
theme.colors.error
theme.colors.warning
theme.colors.success
theme.colors.background
theme.colors.surface
theme.colors.text
theme.colors.textSecondary
theme.colors.border
```

### Spacing
```tsx
theme.spacing.xs   // 4
theme.spacing.sm   // 8
theme.spacing.md   // 16
theme.spacing.lg   // 24
theme.spacing.xl   // 32
theme.spacing['2xl']  // 48
```

### Typography
```tsx
theme.typography.h1
theme.typography.h2
theme.typography.h3
theme.typography.h4
theme.typography.h5
theme.typography.h6
theme.typography.body
theme.typography.caption
```

### Border Radius
```tsx
theme.borderRadius.sm    // 4
theme.borderRadius.md    // 8
theme.borderRadius.lg    // 12
theme.borderRadius.xl    // 16
theme.borderRadius.full  // 9999
```

### Shadows
```tsx
theme.shadows.sm
theme.shadows.base
theme.shadows.md
theme.shadows.lg
theme.shadows.xl
```

## 🔍 Icons

All components use **MaterialCommunityIcons**.

**Browse Icons:** https://pictogrammers.com/library/mdi/

### Common Icon Names
- **UI:** `check`, `close`, `menu`, `dots-vertical`, `chevron-left`, `chevron-right`, `arrow-left`
- **Forms:** `email`, `lock`, `phone`, `account`, `calendar`, `clock`, `map-marker`
- **Actions:** `plus`, `minus`, `edit`, `delete`, `search`, `filter`, `refresh`
- **Media:** `camera`, `image`, `video`, `microphone`, `file`, `folder`
- **Status:** `alert`, `information`, `check-circle`, `close-circle`, `alert-circle`
- **Social:** `heart`, `star`, `share`, `comment`, `send`

## 📱 Platform Support

| Platform | Supported | Notes |
|----------|-----------|-------|
| iOS | ✅ Yes | Requires pod install |
| Android | ✅ Yes | Fully supported |
| Web | ⚠️ Partial | Some components may need adjustments |

## 🚀 Getting Started

### New to the library?
1. Read `SHARED_COMPONENTS_QUICK_START.md`
2. Run installation script
3. Wrap app with `ThemeProvider`
4. Try examples in `SHARED_COMPONENTS_EXAMPLES.tsx`

### Ready to integrate?
1. Follow `SHARED_COMPONENTS_CHECKLIST.md`
2. Reference `SHARED_COMPONENTS_GUIDE.md` for patterns
3. Check `src/components/shared/README.md` for API details

### Need help?
1. Check the examples file
2. Review component README
3. Verify installation checklist
4. Ensure dependencies are installed

## 📊 Statistics

- **Total Files Created:** 32+
- **Components:** 16
- **Theme Files:** 5
- **Documentation Files:** 8
- **Installation Scripts:** 2
- **Type Definitions:** 1
- **Configuration Updates:** 3

## ✨ Features

- ✅ 16 production-ready components
- ✅ Full theme system with light/dark modes
- ✅ Complete TypeScript support
- ✅ MaterialCommunityIcons integration
- ✅ Comprehensive documentation
- ✅ Usage examples
- ✅ Installation scripts
- ✅ Integration checklist

## 🎉 Status

**Implementation:** ✅ Complete  
**Documentation:** ✅ Complete  
**Testing:** 📋 Ready for testing  
**Production:** 🚀 Ready to use  

---

**Quick Links:**
- [Quick Start](./SHARED_COMPONENTS_QUICK_START.md)
- [Full Guide](./SHARED_COMPONENTS_GUIDE.md)
- [Examples](./SHARED_COMPONENTS_EXAMPLES.tsx)
- [API Docs](./src/components/shared/README.md)
- [Checklist](./SHARED_COMPONENTS_CHECKLIST.md)
