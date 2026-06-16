# Implementation Plan - Black & White Theme and Dark Mode (black-ui-design)

## Phase 1: Theme Infrastructure and CSS Variables [checkpoint: 11923a9]
- [x] Task: Set up ThemeProvider and core infrastructure
    - [x] Write unit tests for ThemeProvider component (Red Phase)
    - [x] Implement `src/components/ThemeProvider.tsx` and wrap app in `src/components/Providers.tsx` (Green Phase)
- [x] Task: Configure CSS variables and Tailwind colors
    - [x] Write/verify theme-aware test assertions
    - [x] Update `src/app/globals.css` with dark mode variables, background, foreground, and border color rules (Green Phase)
- [x] Task: Conductor - User Manual Verification 'Phase 1: Theme Infrastructure and CSS Variables' (Protocol in workflow.md)

## Phase 2: Theme Toggle UI and Black & White Accent Redesign (Light Theme)
- [x] Task: Add theme toggle component in Navbar (5e8b5cd)
    - [x] Write unit tests for the theme toggle trigger (Red Phase)
    - [x] Implement theme toggle trigger (sun/moon icons) in `src/components/Navbar.tsx` (Green Phase)
- [x] Task: Refactor Navbar and UploadModal to black & white accent (817cd2f)
    - [x] Update tests in `UploadModal.test.tsx` and `Navbar.test.tsx` to assert new black/white classes and behavior (Red Phase)
    - [x] Replace `blue-*` classes with `zinc-*`/`black`/`white` style tokens in `src/components/Navbar.tsx` and `src/components/UploadModal.tsx` (Green Phase)
- [ ] Task: Refactor Dashboard and Sign-In pages to black & white accent
    - [ ] Update page tests to expect neutral/black/white styled buttons and input rings (Red Phase)
    - [ ] Refactor styles in `src/app/dashboard/[customer_slug]/page.tsx` and `src/app/auth/signin/page.tsx` (Green Phase)
- [ ] Task: Refactor Admin Pages to black & white accent
    - [ ] Update admin page tests to check neutral styles instead of blue accents (Red Phase)
    - [ ] Refactor styles in `src/app/admin/customers/page.tsx` and `src/app/admin/users/page.tsx` (Green Phase)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Theme Toggle UI and Black & White Accent Redesign' (Protocol in workflow.md)

## Phase 3: Dark Mode Styling (Charcoal / Slate Palette)
- [ ] Task: Implement dark mode styles for global layouts
    - [ ] Write tests checking dark mode layout class rendering (Red Phase)
    - [ ] Apply `dark:bg-[#0B0F19]`, `dark:text-zinc-100`, etc., in root layout and navbar (Green Phase)
- [ ] Task: Implement dark mode styles for Dashboard and UploadModal
    - [ ] Write tests checking dark mode classes for file cards, modal containers, and inputs (Red Phase)
    - [ ] Implement `dark:` Tailwind classes in `src/app/dashboard/[customer_slug]/page.tsx` and `src/components/UploadModal.tsx` (Green Phase)
- [ ] Task: Implement dark mode styles for Admin Views and Sign-in
    - [ ] Write tests checking dark mode class applications on admin components (Red Phase)
    - [ ] Implement `dark:` Tailwind classes in `src/app/admin/customers/page.tsx`, `src/app/admin/users/page.tsx`, and `src/app/auth/signin/page.tsx` (Green Phase)
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Dark Mode Styling' (Protocol in workflow.md)
