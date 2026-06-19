# Product Guidelines: Serve-it

## 1. Prose & Communication Style
We communicate with users in a **Professional & Concise** manner. 
- **Tone:** Direct, technical, and objective. 
- **Brevity:** Keep descriptions and instructions short. Avoid unnecessary conversational fluff, exclamation marks, or long-winded setup guides.
- **Error Messages:** State the problem clearly, why it occurred (if known), and how the user can resolve it.
- **Terminology:** Consistent terminology across the app (e.g., use "Customer Workspace", "API Key", "Short URL" consistently).

---

## 2. Visual Theme & Aesthetics
The product interface follows a **Minimalist Black & White** aesthetic with togglable Dark Mode.
- **Color Palette:**
  - Background: Clean white (`#FFFFFF`) and light grays (`#F9FAFB` / `#F3F4F6`) to define boundaries.
  - Typography: Ink-dark text (`#111827`) with medium gray secondary text (`#4B5563`).
  - Accent: Black/white neutral tones (`#111827`/`#FFFFFF`) for primary actions (replacing the previous blue theme).
  - Dark Mode: Togglable charcoal/slate dark gray theme (background `#0B0F19`, containers/cards `#121827`, text `#F3F4F6`).
- **Typography:** Modern, clean sans-serif (e.g., Geist or Inter) with spacious line heights to enhance readability.
- **Layout:** Generous spacing, thin borders, and structured grids. Avoid heavy colored headers.

---

## 3. User Experience (UX) & Interaction Principles
The primary UX goal is **Speed & Efficiency**.
- **Performance First:** Optimize client-side rendering and leverage server component benefits. File uploads and listings must load immediately.
- **Frictionless Sharing:** Minimizing the clicks required to perform actions. E.g., once a file is uploaded, copy the share link to the clipboard automatically or with a single click.
- **Keyboard Friendliness:** Core actions (e.g., search, create workspace, confirm delete) should be easily navigable with standard keyboard shortcuts.
- **Clean States:** Avoid visual clutter. When there are no files, provide a single, elegant upload button rather than complex descriptive illustrations.
