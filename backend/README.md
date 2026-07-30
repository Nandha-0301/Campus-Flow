# CampusFlow Backend

Production-ready Node/Express backend for CampusFlow (role-based college ERP).

## Tech
- Node.js + Express
- MongoDB + Mongoose
- Firebase Admin SDK (ID token verification)

## Run
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set values
4. `npm run dev`

## Response Contract
All APIs return:
```json
{
  "success": true,
  "message": "...",
  "data": { }
}
```
Error shape:
```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```

## Core Flows
- Admin creates users/subjects and assigns staff to subjects.
- Staff records attendance and marks, creates assignments.
- Students view dashboard, marks, attendance from live data.
- Parents monitor linked students and notices.

## Auth
Frontend sends Firebase ID token in `Authorization: Bearer <token>`.
Backend verifies token and maps to MongoDB user, attaching `req.user`.
