# AgroLoop deployment

## Firebase Hosting

1. Run `npx firebase-tools login` and complete Google authorization in the browser.
2. Run `npx firebase-tools use agroloop-74273`.
3. Run `npm run deploy`.
4. Add the generated Firebase Hosting domain, usually `agroloop-74273.web.app`, under Firebase Authentication > Settings > Authorized domains.

The repository is configured to build `dist`, serve the Vite SPA correctly, deploy the database rules, and add basic security headers.

## Vercel from GitHub

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Set the framework preset to Vite and keep the build command as `npm run build`.
4. Add the seven `VITE_FIREBASE_*` variables from `.env.example` in Vercel Project Settings for every environment.
5. Add the Vercel production domain to Firebase Authentication authorized domains.

`vercel.json` provides the SPA rewrite and security headers. Firebase web configuration is client-side configuration, not a secret; authorization is enforced by Firebase Auth and `database.rules.json`.

## Firebase rules

Install or run the Firebase CLI with access to the project, then deploy the rules from the repository root:

```bash
npx firebase-tools login
npx firebase-tools use agroloop-74273
npx firebase-tools deploy --only database
```

Enable Phone authentication in Firebase Console, add `localhost` and the Vercel production domain under Authentication > Settings > Authorized domains, and use the Web app configuration (`appId` starts with `1:...:web:`) in the Vercel variables. The Android app ID must not be used for the web app. Phone authentication may also require billing enabled for the Firebase project.