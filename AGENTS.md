# Agent Guidelines for uni-planner

## Build/Lint/Test Commands
- Build: `npm run build`
- Dev server: `npm run dev`
- Lint: `npm run lint` (uses ESLint with Next.js config)
- Database: `npm run db:generate` (Drizzle schema), `npm run db:migrate` (run migrations)
- No test suite configured

## Code Style & Conventions
- **Imports**: Use `@/` path mapping for src folder imports, organize by external libs first then internal
- **TypeScript**: Strict mode enabled, explicit types for function params/returns, use type exports from schema
- **Components**: Use `forwardRef` for UI components, define Props type interface, use `cn()` utility for className merging
- **Actions**: Server actions in `"use server"` files, always check `getUserId()` auth, use `revalidatePath()` after mutations
- **Database**: Drizzle ORM with SQLite, use schema types (`Course`, `Session`), all queries in `src/db/queries.ts`
- **Naming**: camelCase for variables/functions, PascalCase for components/types, kebab-case for files
- **Error Handling**: Throw Error with descriptive messages, handle auth failures consistently

## Architecture Notes
- Next.js 15 with App Router, React 19, TypeScript, TailwindCSS
- Authentication via NextAuth/better-auth
- Database operations require user authentication
- File structure: actions in app/, UI components in components/, utilities in lib/