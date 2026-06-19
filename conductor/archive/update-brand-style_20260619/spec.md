# Specification: Update Brand Style (Serve-it)

## Overview
This track implements a platform-wide (Public landing pages, Auth pages, and Workspace) brand style update based on the new "Serve-it — Brand & Identity Guidelines". The design is rooted in extreme performance, cybersecurity, and absolute transparency with an emphasis on a pure, minimalist, and highly legible aesthetic. We will leverage a Tailwind UI component library (e.g. shadcn/ui) but heavily customize it to meet these strict brand guidelines.

## Functional Requirements
1. **Color Palette Implementation:**
   - Define CSS custom properties/Tailwind configuration per the guidelines.
   - Primary background: Pure White (`#ffffff`), Alternate: Light UI Gray (`#f6f7f9`) & Soft (`#fafbfc`).
   - Text elements: Obsidian Slate (`#1a2030`) for primary body/headers, Muted Charcoal (`#4a5568`) for secondary text.
   - Borders/Dividers: Border Gray (`#e2e5ea`) & Soft Border (`#eef0f3`).
   - Primary Accent: Pass-Through Green (`#1a8744`).
2. **Typography Configuration:**
   - Base font: `Montserrat` (body weight 400/500, line-height 1.55; headers weight 700/800 with `-0.025em` tracking).
   - Monospace font: `JetBrains Mono` (weight 500, uppercase with `0.08em` tracking) for code, technical labels, URLs, etc.
3. **Component Structural Refactoring:**
   - **Buttons and CTAs:** Apply `0px` border radius (straight and square edges, editorial solid style).
   - **Code Containers and Cards:** Apply a maximum `3px` border radius to soften rendering, with generous padding (minimum `32px` in cards).
4. **Logo Implementation:**
   - Implement the "Option 2" concept logo: two angular code brackets `[ ]` crossed by a solid sharp arrow in Pass-Through Green.
   - Position the corporate slogan "UNMODIFIED HTML SERVING LAYER" below the brand name (right-aligned, monospace open tracking).

## Non-Functional Requirements
- **Consistency:** Ensure consistent application of styles across all Next.js App Router pages.
- **Tone and Voice:** Any copywriting updates must reflect "The Unaltered Truth" and direct engineering clarity.

## Acceptance Criteria
- [ ] `tailwind.css` and `tailwind.config` (or Next.js equivalent) are updated with the custom CSS variables, colors, and fonts.
- [ ] Required Google Fonts (`Montserrat`, `JetBrains Mono`) are imported and applied globally.
- [ ] Buttons and CTAs feature 0px border radius and use Pass-Through Green.
- [ ] Card components use max 3px border radius and specified backgrounds.
- [ ] Logo is updated to reflect the new design concept and includes the monospace slogan.
- [ ] The updated visual identity is successfully applied across Landing Pages, Auth Pages, and the Authenticated Workspace.

## Out of Scope
- Major architectural changes or new functionality beyond visual/component updates.
- Complete copy rewrites.
