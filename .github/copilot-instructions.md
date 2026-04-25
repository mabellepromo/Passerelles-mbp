# Project Guidelines

## Code Style
- Use ES modules with import/export syntax
- Follow React functional components with hooks
- Use Tailwind CSS classes for styling; reference [src/index.css](src/index.css) for custom theme colors and shadows
- All UI text in French; maintain localization consistency
- Use `@/` import alias for `src/` directory (configured in jsconfig.json and vite.config.js)

## Architecture
- **Auto-generated page registry**: Create new pages in `src/pages/`; routing updates automatically via [src/pages.config.js](src/pages.config.js) (only edit `mainPage` value manually)
- **Data layer**: Use `base44.entities.*` factory pattern from [src/api/base44Client.js](src/api/base44Client.js) for all Supabase interactions
- **Caching**: React Query for server state; invalidate cache after mutations
- **Auth**: Supabase magic link OTP; admin role hardcoded to specific emails
- **Component boundaries**: Admin features in `src/components/admin/`; user components elsewhere; UI primitives in `src/components/ui/`

## Build and Test
- `npm run dev`: Start Vite development server
- `npm run build`: Production build
- `npm run lint`: ESLint check
- `npm run lint:fix`: Auto-fix linting issues
- `npm run typecheck`: TypeScript validation via jsconfig.json
- `npm run preview`: Preview production build

## Conventions
- Entity names match Supabase table names (e.g., `Binome`, `Mentor`, `Mentore`)
- Use `formatName.js` utility for Togolese name formatting (ALL-CAPS detected as surname)
- Ordering: Prefix `-` for descending sort (e.g., `list('-created_date')`)
- Forms: react-hook-form with zod validation
- Error handling: Try-catch or error object checks; display in UI
- Animations: Framer Motion for page transitions and interactions</content>
<parameter name="filePath">c:\Users\maman\Downloads\passerelles_clone\.github\copilot-instructions.md