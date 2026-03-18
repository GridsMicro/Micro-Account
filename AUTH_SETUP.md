# 🔐 Authentication System Setup Guide

## Overview
The application now has a complete authentication system using **NextAuth.js v5** with:
- ✅ Real login/logout functionality
- ✅ Protected dashboard and routes
- ✅ Database-backed user credentials
- ✅ Secure password hashing with bcryptjs
- ✅ Session management with JWT tokens

---

## 📋 What Was Implemented

### 1. **Authentication Configuration** (`lib/auth.ts`)
- NextAuth.js v5 with Credentials provider
- Password verification against database
- JWT session strategy (24-hour expiry)
- User role support

### 2. **Authentication API Route** (`app/api/auth/[...nextauth]/route.ts`)
- NextAuth handlers for sign-in/sign-out/callback

### 3. **Route Protection Middleware** (`middleware.ts`)
- Protects all routes except `/login` and `/api/auth/*`
- Redirects unauthenticated users to login page

### 4. **Updated Login Page** (`app/login/page.tsx`)
- Real authentication with `signIn()` function
- Error messaging for failed login attempts
- Loading state during authentication

### 5. **Logout Button** (`components/Sidebar.tsx`)
- Changed from link to actual logout button using `signOut()`
- Secure session termination

---

## ⚙️ Setup Instructions

### Step 1: Set Environment Variables

Create a `.env.local` file in the project root (if not already exists):

```env
# Database Connection
DATABASE_URL=postgresql://user:password@localhost:5432/microtronic

# NextAuth Secret (generate a new one for production)
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 2: Initialize Database

Run the database initialization script (if not already done):
```bash
npm run dev
# Then in another terminal:
npx ts-node init_db.ts
```

### Step 3: Create Admin User

Create a test admin user with hashed password:

```bash
# Windows PowerShell
$env:DATABASE_URL = "your-database-url"
node create_admin_user.js

# Or set in .env.local then run
node create_admin_user.js
```

**Default test credentials:**
- Email: `admin@microtronic.biz`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the password immediately after first login!

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🧪 Testing Authentication

1. **Without Login** (unprotected):
   - Navigate to `http://localhost:3000` → Redirected to `/login`

2. **Login**:
   - Email: `admin@microtronic.biz`
   - Password: `admin123`
   - Click "เข้าสู่ระบบ"

3. **After Login**:
   - You'll be redirected to the dashboard
   - Sidebar shows "Secure Logout" button
   - Click to logout and be redirected to login page

---

## 🔒 Changing Password

To change the password for a user, you can update the database directly:

```sql
-- Connect to your database and run:
UPDATE users 
SET password = '$2a$10$HASHED_PASSWORD_HERE'
WHERE email = 'admin@microtronic.biz';
```

Or create a new admin user with a different password by running the create_admin_user.js script again with a different email.

---

## 🛡️ Adding More Users

Update the `create_admin_user.js` script or create a user management page to add more users. Users will be created with their email and a hashed password.

Example user creation (SQL):
```sql
INSERT INTO users (name, email, password, role, status)
VALUES (
  'John Doe',
  'john@example.com',
  '$2a$10$HASHED_PASSWORD_HERE',
  'Member',
  'Active'
);
```

---

## 📦 Dependencies Added

- **next-auth@beta** - Authentication framework
- **bcryptjs** - Password hashing library

---

## 🐛 Troubleshooting

### Issue: "User not found" when logging in
- **Solution**: Make sure the user was created with the correct email in the database
- Check: `SELECT * FROM users;`

### Issue: "Invalid password"
- **Solution**: Ensure the password was properly hashed when creating the user
- Use the `create_admin_user.js` script to create users properly

### Issue: Session expires too quickly
- **Solution**: Adjust `maxAge` in `lib/auth.ts` (currently 24 hours)
- Change line: `maxAge: 24 * 60 * 60` to your desired duration (in seconds)

### Issue: Middleware blocking access
- **Solution**: Check that `middleware.ts` is in the root directory (not in `/app`)
- Verify public routes are correctly listed in the middleware

---

## 🔗 Protected Routes

All routes are protected EXCEPT:
- `/login` - Login page
- `/api/auth/*` - Authentication endpoints

To add public routes (like a pricing page), add them to the `publicRoutes` array in `middleware.ts`.

---

## 📚 NextAuth.js v5 Documentation

For more information about NextAuth.js:
- [NextAuth.js Official Docs](https://authjs.dev)
- [Session Management](https://authjs.dev/getting-started/session-management)
- [Credentials Provider](https://authjs.dev/getting-started/authentication-providers)

---

**Status**: ✅ Authentication system is ready for testing and production deployment.
