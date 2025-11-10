# 📁 Project Structure - Dermaglare Admin Portal

## 🎯 Overview

This document outlines the reorganized, optimized structure of the Dermaglare Admin Portal. The structure follows React best practices and modern architectural patterns for maintainability and scalability.

---

## 📂 Directory Structure

```
src/
├── assets/                    # Static assets (images, icons, fonts)
│   ├── dermaglare-logo.png   # Official Dermaglare logo
│   └── react.svg              # React logo
│
├── components/                # React components
│   ├── auth/                  # Authentication-related components
│   │   └── LoginPage.tsx      # Login page component
│   │
│   ├── chat/                  # Chat management components
│   │   └── ChatManagement.tsx # Chat interface & management
│   │
│   ├── common/                # Reusable common components
│   │   └── Preloader.tsx      # Loading screen component
│   │
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── DashboardStats.tsx # Statistics cards
│   │   ├── DashboardCharts.tsx# Chart components
│   │   └── TodaysSchedule.tsx # Today's schedule view
│   │
│   └── EnhancedAppointmentManagement.tsx # Appointment management
│
├── constants/                 # Application constants
│   └── navigation.ts          # Navigation menu configuration
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts             # Authentication hook
│   └── useFirestoreData.ts    # Firestore data fetching hook
│
├── pages/                     # Page-level components
│   ├── DashboardPage.tsx      # Dashboard page
│   ├── UserManagementPage.tsx # User management page
│   └── SettingsPage.tsx       # Settings page
│
├── types/                     # TypeScript type definitions
│   └── index.ts               # All app-wide types
│
├── utils/                     # Utility functions
│   └── styleHelpers.ts        # Style/theme helper functions
│
├── AdminDashboard.tsx         # Main dashboard container (TO BE REFACTORED)
├── App.tsx                    # App entry point
├── firebase.ts                # Firebase configuration
├── index.css                  # Global styles
├── Layout.tsx                 # Main layout component
└── main.tsx                   # React entry point
```

---

## 🗂️ Folder Descriptions

### `/assets`

**Purpose**: Static files like images, fonts, and icons

- **When to use**: Store media files that don't change
- **Best practice**: Use descriptive names, organize by type if needed

### `/components`

**Purpose**: Reusable React components organized by feature/domain

#### `/components/auth`

- Authentication-related UI components
- Login, register, password reset forms
- Auth-specific modals and dialogs

#### `/components/chat`

- Chat interface components
- Message threads, chat windows
- Real-time messaging components

#### `/components/common`

- Shared components used across multiple features
- Preloader, modals, buttons, form inputs
- Layout components

#### `/components/dashboard`

- Dashboard-specific components
- Statistics cards, charts, widgets
- Dashboard-only UI elements

### `/constants`

**Purpose**: Application-wide constants and configuration

- Navigation menus
- API endpoints
- Feature flags
- Static configuration data

### `/hooks`

**Purpose**: Custom React hooks for shared logic

- **useAuth**: Authentication state and methods
- **useFirestoreData**: Data fetching and caching
- **useTheme**: Theme management
- **Best practice**: One hook per file, descriptive names

### `/pages`

**Purpose**: Page-level components representing routes

- Each file represents a full page/view
- Compose smaller components from `/components`
- Handle page-level state and data fetching

### `/types`

**Purpose**: TypeScript interfaces and type definitions

- Shared types used across the application
- API response types
- Component prop types
- **Best practice**: Export all types from index.ts

### `/utils`

**Purpose**: Helper functions and utilities

- Style helpers
- Data transformations
- Validation functions
- Date/time utilities
- **Best practice**: Pure functions, well-tested

---

## 📋 Component Organization Rules

### 1. **Single Responsibility**

Each component should do ONE thing well

```tsx
// ❌ Bad: Component does too much
<DashboardEverything />

// ✅ Good: Separated concerns
<DashboardPage>
  <DashboardStats />
  <DashboardCharts />
  <TodaysSchedule />
</DashboardPage>
```

### 2. **File Naming Conventions**

- **Components**: PascalCase (e.g., `LoginPage.tsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.ts`)
- **Utils**: camelCase (e.g., `styleHelpers.ts`)
- **Types**: camelCase (e.g., `index.ts`)
- **Constants**: camelCase or SCREAMING_SNAKE_CASE (e.g., `navigation.ts`)

### 3. **Import Order**

```tsx
// 1. External libraries
import React, { useState } from "react";
import { motion } from "framer-motion";

// 2. Internal modules
import { useAuth } from "../../hooks/useAuth";
import { AppUser } from "../../types";

// 3. Components
import LoginPage from "../../components/auth/LoginPage";

// 4. Utils and helpers
import { getCardClasses } from "../../utils/styleHelpers";

// 5. Assets
import logo from "../../assets/dermaglare-logo.png";

// 6. Styles (if separate)
import "./styles.css";
```

### 4. **Component Structure**

```tsx
// 1. Imports
import React from "react";

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
}

// 3. Component
const MyComponent: React.FC<ComponentProps> = ({ title }) => {
  // 3a. Hooks
  const [state, setState] = useState();

  // 3b. Functions
  const handleClick = () => {};

  // 3c. Effects
  useEffect(() => {}, []);

  // 3d. Render
  return <div>{title}</div>;
};

// 4. Export
export default MyComponent;
```

---

## 🔄 Refactoring Roadmap

### Phase 1: ✅ Completed

- [x] Created folder structure
- [x] Extracted types to `/types`
- [x] Created utility functions in `/utils`
- [x] Moved constants to `/constants`
- [x] Created custom hooks
- [x] Extracted auth components

### Phase 2: 🚧 In Progress

- [ ] Break down `AdminDashboard.tsx` (1485 lines → smaller components)
- [ ] Create dashboard page components
- [ ] Extract user management components
- [ ] Create settings page components

### Phase 3: 📅 Planned

- [ ] Add unit tests for hooks
- [ ] Add component tests
- [ ] Create Storybook documentation
- [ ] Add E2E tests
- [ ] Performance optimization

---

## 🎯 Benefits of This Structure

### 1. **Maintainability**

- Clear organization makes code easy to find
- Smaller files are easier to understand
- Reduces cognitive load

### 2. **Scalability**

- Easy to add new features
- Clear patterns to follow
- Supports team growth

### 3. **Reusability**

- Components can be easily shared
- Hooks promote DRY principle
- Utils can be unit tested

### 4. **Developer Experience**

- Fast navigation with clear structure
- Predictable file locations
- Better IDE autocomplete

### 5. **Performance**

- Easier code splitting
- Better tree shaking
- Optimized bundle sizes

---

## 🛠️ Development Guidelines

### Creating New Components

1. Determine the component's domain/feature
2. Place in appropriate folder
3. Create accompanying test file
4. Export from index.ts if needed
5. Update this documentation

### Creating New Hooks

1. Start with "use" prefix
2. Place in `/hooks`
3. Add TypeScript types
4. Include JSDoc comments
5. Write unit tests

### Creating New Pages

1. Place in `/pages`
2. Compose from smaller components
3. Handle route-level concerns
4. Add to navigation if needed

---

## 📚 Additional Resources

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

## 🔍 Quick Reference

### Finding Files

- **UI Component?** → `/components/[domain]/ComponentName.tsx`
- **Shared Type?** → `/types/index.ts`
- **Helper Function?** → `/utils/helperName.ts`
- **Custom Hook?** → `/hooks/useHookName.ts`
- **Configuration?** → `/constants/configName.ts`
- **Page/Route?** → `/pages/PageName.tsx`
- **Asset?** → `/assets/filename.ext`

### Common Tasks

- **Add new page**: Create in `/pages`, add to routes
- **Add new component**: Place in appropriate `/components` subfolder
- **Add shared logic**: Create custom hook in `/hooks`
- **Add utility**: Create function in `/utils`
- **Add type**: Add to `/types/index.ts`

---

**Last Updated**: November 8, 2025  
**Version**: 2.0.0 - Restructured  
**Status**: ✅ In Progress

---

_This structure is designed to grow with your application while maintaining clarity and organization._
