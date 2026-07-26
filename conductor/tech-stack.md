# Technology Stack: Serve-it

## Core Architecture & Frameworks
- **Language:** **TypeScript / JavaScript** (ESNext, Bun runtime)
- **Runtime & Package Manager:** **Bun** (`bun`)
- **Framework:** **TanStack Start** with **React 19** using TanStack Router (`src/routes/`) & **Vite**
- **Styling:** **Tailwind CSS v4** with `@tailwindcss/vite` for component styling

## Infrastructure & Deployment
- **Hosting:** **Google Cloud Run** (Docker containerized using Bun base image)
- **CI/CD:** **GitHub Actions** with automated deployment and environment secret injection

## Database & Data Access
- **Database Engine:** **PostgreSQL**
- **ORM / Client:** **Prisma Client** (using schema at `prisma/schema.prisma`)

## Third-Party Services & Storage
- **Object Storage & Client:** **Supabase** via `@supabase/supabase-js` for file upload and storage backing
- **Authentication Provider:** **Better Auth** (`better-auth`) for user sign-in and session management

## Testing & Quality Assurance
- **Test Runner:** **Vitest** (`vitest`) with `happy-dom` and `@testing-library/react`
- **Coverage:** Vitest V8 coverage (`@vitest/coverage-v8`)

## Additional Integration Libraries
- **Model Context Protocol (MCP) SDK:** `@modelcontextprotocol/sdk` for exposing/interacting with MCP servers
- **Data Validation:** **Zod** (`zod`) for API parameter and schema validation
- **Icons:** **Lucide React** (`lucide-react`) & **React Icons** (`react-icons`)
