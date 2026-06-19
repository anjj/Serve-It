# Technology Stack: Serve-it

## Core Architecture & Frameworks
- **Language:** **TypeScript / JavaScript** (ESNext, Node.js environment)
- **Framework:** **Next.js 16** with **React 19** using the App Router (`src/app/`)
- **Styling:** **Tailwind CSS v4** with `@tailwindcss/postcss` for component styling

## Infrastructure & Deployment
- **Hosting:** **Google Cloud Run** (Docker containerized)
- **CI/CD:** **GitHub Actions** with automated deployment and environment secret injection

## Database & Data Access
- **Database Engine:** **PostgreSQL**
- **ORM / Client:** **Prisma Client** (using schema at `prisma/schema.prisma`)
- **Adapter:** `@auth/prisma-adapter` for database-backed authentication storage

## Third-Party Services & Storage
- **Object Storage & Client:** **Supabase** via `@supabase/supabase-js` for file upload and storage backing
- **Authentication Provider:** **NextAuth.js** (`next-auth`) for user sign-in and session management

## Additional Integration Libraries
- **Model Context Protocol (MCP) SDK:** `@modelcontextprotocol/sdk` for exposing/interacting with MCP servers
- **Data Validation:** **Zod** (`zod`) for API parameter and schema validation
- **Icons:** **Lucide React** (`lucide-react`)
