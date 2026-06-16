# Specification: Black & White Theme and Dark Mode (black-ui-design)

## 1. Overview
The goal of this track is to update the application's visual aesthetics:
1. **Black & White Accent Redesign (Light Theme):** Replace all standard blue accents, buttons, badges, and focus rings across the app (Navbar, Admin panels, Dashboard, Search, Sign-in, and Upload Modal) with a high-contrast black-and-white theme matching the main landing page (`bg-zinc-900`/`bg-white`).
2. **Charcoal / Slate Dark Mode:** Implement a dark mode theme utilizing a sleek charcoal/slate dark gray palette (e.g., `#0B0F19`, `#121827`) with soft contrasts, white text, and clean borders.
3. **Theme Persistence & Detection:** Toggle dark mode via a button in the Navbar, persisting the preference in `localStorage` and respecting system preferences (`prefers-color-scheme`).

---

## 2. Functional Requirements

### 2.1 Black & White Accent Styling (Light Theme)
- **Primary Buttons:** Change all blue buttons (e.g., "Create Customer", "Assign Workspace", "Upload File", "View Document", NextAuth Azure AD Sign-in) to a black-and-white style:
  - Background: `bg-zinc-900`
  - Text: `text-white`
  - Hover: `hover:bg-zinc-800`
- **Secondary Buttons & Action Buttons:**
  - Background: `bg-white` or `bg-zinc-100`
  - Border: `border-zinc-300`
  - Text: `text-zinc-700`
  - Hover: `hover:bg-zinc-50`
- **Badges (e.g., assigned workspaces):** Change from light-blue background (`bg-blue-100` / `text-blue-800`) to a neutral background (`bg-zinc-100` / `text-zinc-800`).
- **Focus Rings & Borders:** Replace `focus:ring-blue-500` and `focus:border-blue-500` on input fields, selects, and textareas with neutral focus rings (`focus:ring-zinc-900` / `focus:border-zinc-900` or `focus:ring-black`).
- **Logo / Navbar Text:** Replace `text-blue-600` on the "Serve-It" text in the navbar with `text-zinc-900`.

### 2.2 Charcoal / Slate Dark Mode
- **Layout background:** Apply `dark:bg-[#0B0F19]` or `dark:bg-[#121827]` to the app layout, pages, and components.
- **Card and Aside background:** Cards, sidebar, modal background should change to a slightly lighter dark gray in dark mode (e.g., `dark:bg-[#1E293B]` or `dark:bg-zinc-900` / `dark:border-zinc-800`).
- **Text colors:** Transition standard text to light gray/white (e.g., `dark:text-zinc-100` for main headings, `dark:text-zinc-400` for secondary text).
- **Dark Mode Buttons:** Primary buttons in dark mode can invert to `dark:bg-white` and `dark:text-zinc-900` or stay high-contrast gray.
- **Theme Toggle:** Add a theme toggle switch (Sun / Moon icons using `lucide-react`) in the header/Navbar.

### 2.3 Theme Synchronization & Persistence
- **Storage:** Persist theme state (`light` or `dark`) in browser `localStorage`.
- **System Preference:** Default to standard system preference (`window.matchMedia('(prefers-color-scheme: dark)')`) on initial load.
- **Theme Provider:** Implement or configure a ThemeProvider/context (e.g., `next-themes` or custom React Context) to manage the `.dark` class on the `<html>` or `<body>` element to prevent layout shifts.

---

## 3. Non-Functional Requirements
- **No Flash of Light Theme:** Ensure the initial theme is loaded early in the document to prevent a white flash when users visit the site in dark mode.
- **Visual Harmony:** Follow the tech stack's styling guidelines: Tailwind CSS v4 with clean typography, spacious line heights, and micro-animations for the theme toggle.
- **Accessibility:** Text colors on dark backgrounds must meet WCAG AA contrast ratio requirements.

---

## 4. Acceptance Criteria
1. **Light Theme Refactor:** All blue elements (buttons, focus borders, badges, navbar logo text) are replaced with black/white/gray stylings.
2. **Dark Mode Integration:** Adding a toggle button to the navbar correctly toggles the `.dark` class.
3. **Theme Styling:** When `.dark` class is present, the interface background changes to a dark charcoal/slate theme and all text turns readable light gray/white.
4. **State Persistence:** Toggling the mode and reloading the page maintains the selected mode.
5. **Clean Transition:** The shift between light and dark modes is smooth.
6. **No Flash:** Visiting the site directly with a set dark mode preference does not flash white.
