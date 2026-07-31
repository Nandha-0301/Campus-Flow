# CampusFlow Deployment Checklist

## Render Backend

Set these environment variables in Render for the backend service:

- `PORT`
- `CLIENT_ORIGIN`
- `MONGO_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Alternative:

- Use `FIREBASE_SERVICE_ACCOUNT_KEY` instead of `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`

Backend values to confirm:

- `CLIENT_ORIGIN=https://campus-flow-snowy.vercel.app`
- `MONGO_URI` points to the production MongoDB Atlas database
- `FIREBASE_PRIVATE_KEY` preserves newline characters, or uses `\n` escapes exactly once
- The backend is redeployed after any environment variable change

## Vercel Frontend

Set these environment variables in Vercel:

- `VITE_API_BASE_URL=https://campus-flow-1-n386.onrender.com/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Frontend values to confirm:

- `VITE_API_BASE_URL` points to the Render backend, not localhost
- `VITE_FIREBASE_AUTH_DOMAIN` matches the existing Firebase project
- The frontend is redeployed after any environment variable change

## Firebase Console

The `auth/unauthorized-domain` error is fixed in Firebase Console, not in code.

1. Open Firebase Console for the existing project.
2. Go to `Authentication`.
3. Open `Settings`.
4. In `Authorized domains`, add `campus-flow-snowy.vercel.app`.
5. Save changes.
6. Verify `Google` is enabled in `Authentication > Sign-in method`.
7. Verify `Email/Password` is enabled in `Authentication > Sign-in method`.

## Production Verification

Check these after redeploying both services:

- Frontend loads from `https://campus-flow-snowy.vercel.app`
- Backend health endpoint responds from `https://campus-flow-1-n386.onrender.com/health`
- `GET /api/auth/settings` succeeds from the Vercel origin
- Browser preflight `OPTIONS` requests return CORS headers
- Responses include `Access-Control-Allow-Origin: https://campus-flow-snowy.vercel.app`
- Responses include `Access-Control-Allow-Credentials: true`
- Requests with `Authorization: Bearer ...` are accepted
- MongoDB Atlas connection succeeds in Render logs
- Firebase Admin initializes successfully in Render logs
- Login, signup, and Google sign-in complete without console errors
- Protected routes load after authentication
