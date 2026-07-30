# Role-Based College Management System - Frontend Setup Guide

This React application acts as the frontend for the **Role-Based College Management System**. It uses Firebase for Authentication and a standard REST API backend (Node/Express/MongoDB) for managing users, attendance, and grades based on roles.

## 🚀 1. Firebase Setup (Authentication)

You must configure Firebase manually to connect the authentication system:

1. **Create a Firebase Project:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Click **Add project** and follow the setup wizard.

2. **Enable Authentication Methods:**
   - In your Firebase project, navigate to **Build > Authentication**.
   - Click **Get Started**, then go to the **Sign-in method** tab.
   - Click **Add new provider**.
   - Enable **Email/Password**.
   - Enable **Google** (you will need to provide a support email).

3. **Get Firebase Configuration Keys:**
   - Go to **Project Settings** (gear icon in the top left).
   - Scroll down to **Your apps**, click the web icon (`</>`), and register your app.
   - Copy the `firebaseConfig` object values provided.

---

## 🔐 2. Environment Variables (.env) Setup

Once you have your Firebase keys, you need to create your `.env` file in the `frontend` root directory.

1. Create a file named `.env` in the `frontend` directory.
2. Add your keys replacing the placeholders:

```env
# Backend API URL (Update if port differs)
VITE_API_BASE_URL=http://localhost:5000/api

# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdefg
```

---

## 🔗 3. Backend Connection & Token Verification

The frontend uses Firebase Authentication to securely verify users. It then retrieves their **ID Token** and sends it to the backend to get their role.

### How the Frontend sends the token:
The `src/api/axios.js` file automatically attaches the Firebase user's ID token to every request under the `Authorization` header:
```javascript
// Example of what axios interceptor does behind the scenes:
Authorization: Bearer <Firebase_ID_Token>
```

### How the Backend verifies the token (Node/Express example):
Your backend must verify this ID token using the Firebase Admin SDK.

1. **Install Firebase Admin on Backend:**
   ```bash
   npm install firebase-admin
   ```

2. **Create Middleware (verifyToken.js):**
   ```javascript
   const admin = require('firebase-admin');
   // Initialize admin with your serviceAccountKey.json

   const verifyToken = async (req, res, next) => {
     const authHeader = req.headers.authorization;
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return res.status(401).json({ message: 'Unauthorized' });
     }
     
     const token = authHeader.split(' ')[1];
     try {
       const decodedToken = await admin.auth().verifyIdToken(token);
       req.user = decodedToken; // contains UID and Email
       next();
     } catch (error) {
       res.status(401).json({ message: 'Invalid Token' });
     }
   };
   
   module.exports = verifyToken;
   ```

3. **Return User Role Route (e.g., `/api/auth/role`):**
   When the frontend hits this route, check the `req.user.email` or `req.user.uid` against your MongoDB to return the role `['admin', 'staff', 'student', 'parent']`.

---

## 🏃 4. Running the Project

1. Install Dependencies:
   ```bash
   npm install
   ```

2. Start the Development Server:
   ```bash
   npm run dev
   ```

3. Open exactly [http://localhost:5173](http://localhost:5173).

> **Note:** The current `AuthContext` has mocked role return logics. Once your backend is ready, navigate to `src/context/AuthContext.jsx` and uncomment the real `api.post('/auth/role')` call to rely entirely on the backend for User Roles.
