# Outreach

Outreach helps life insurance and employee-benefits agents remember the people they want to stay in touch with. Add a person, jot a note, and log a conversation. Anyone you have not spoken with in 30 days shows up as needing attention. At 60 days they have gone cold. The week before that 30-day mark, they show up under follow up.

A new install starts with an empty list. Nothing is filled in for you, and the code does not contain sample people.

## Use it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). People you add are saved in this browser. Refresh the page and they are still there. Another browser, or another computer, has its own list until an account and shared database are added later.

## Why this shape

The first version was one `index.html` file that saved data with Claude’s built-in storage. This version is a Next.js app (React and TypeScript) because Outreach will be hosted on Vercel. The screens are React components, and the look comes from one set of design tokens (type, space, color, radius, shadow, and a 44px minimum tap size).

Text uses [Inter](https://rsms.me/inter/), self-hosted with the app, so Windows, Android, and Mac render the same letters. If that file cannot load, the page falls back to the device’s system font (San Francisco, Segoe UI, or Roboto).

Saving goes through a `ContactStore` interface in `lib/storage/store.ts`. Today that interface stores the list in `localStorage`. A Supabase adapter can implement the same interface later without rewriting the screens. Accounts, billing, and texting are not part of this version.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

GitHub Actions runs those checks on every pull request.
