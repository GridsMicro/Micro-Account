# 🚀 Authentication System - Quickstart

## ✅ What's Been Done

Your application now has a complete, production-ready authentication system:

### 1. **Real Login System** 
- Users can now log in with email and password
- Passwords are securely hashed using bcryptjs
- Login page validates credentials against the database

### 2. **Protected Dashboard**
- All routes except `/login` are protected
- Unauthenticated users are redirected to login
- Session automatically expires after 24 hours

### 3. **Logout Functionality**
- "Secure Logout" button in the sidebar
- Properly terminates user session
- Redirects to login page after logout

---

## 🔧 How to Get Started

### 1. **Configure Environment Variables**

Create a `.env.local` file in the project root:

```env
DATABASE_URL=postgresql://user:password@neon.tech/microtronic

NEXTAUTH_SECRET=enter-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

**Generate a new secret:**
```bash
# On Windows PowerShell:
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString() + [guid]::NewGuid().ToString())) | Out-Host
```

### 2. **Create Test Admin User**

Once DATABASE_URL is set in .env.local:

```bash
# Make sure DATABASE_URL is in .env.local
node create_admin_user.js
```

Or create manually in database:
```sql
-- Hash password "admin123" first using an online bcrypt generator
-- Then insert:
INSERT INTO users (name, email, password, role, status) 
VALUES ('Administrator', 'admin@microtronic.biz', '$2a$10$HASH_HERE', 'Administrator', 'Active');
```

### 3. **Start Development Server**

```bash
npm run dev
```

Then open: `http://localhost:3000`

---

## 🔐 Test Login

**Credentials for testing:**
- Email: `admin@microtronic.biz`
- Password: `admin123`

1. You'll be redirected to login automatically
2. Enter credentials
3. Click "เข้าสู่ระบบ" (Sign In)
4. Dashboard loads and you're authenticated!

---

## 📝 Key Files Modified

| File | Change |
|------|--------|
| `lib/auth.ts` | ✅ NEW - Authentication configuration |
| `app/api/auth/[...nextauth]/route.ts` | ✅ NEW - Auth API endpoints |
| `middleware.ts` | ✅ NEW - Route protection middleware |
| `app/login/page.tsx` | 🔄 UPDATED - Uses real authentication |
| `components/Sidebar.tsx` | 🔄 UPDATED - Real logout button |

---

## ⚙️ Configuration Details

**Session Duration**: 24 hours (configurable in `lib/auth.ts`)

**Protected Routes**: All except:
- `/login` - Login page
- `/api/auth/*` - Authentication endpoints

**Database User Structure**:
```
users table:
- id (primary key)
- name (user's full name)
- email (unique identifier)
- password (bcryptjs hashed)
- role (Administrator, Member, etc.)
- status (Active, Inactive)
- created_at (timestamp)
```

---

## 🆘 Troubleshooting

### Can't log in - "User not found"
→ Create the admin user using `create_admin_user.js`

### Password doesn't work
→ Use the correct test password: `admin123`

### Still redirected to login after entering credentials
→ Check:
1. Database connection is working
2. User exists in database: `SELECT * FROM users WHERE email = 'admin@microtronic.biz';`
3. NEXTAUTH_SECRET is set in .env.local

### Session expires too fast/slow
→ Edit `lib/auth.ts` line: `maxAge: 24 * 60 * 60` (in seconds)

---

## 📚 Documentation

For complete setup instructions, see: **[AUTH_SETUP.md](./AUTH_SETUP.md)**

---

## 🎯 Next Steps (Optional)

1. **Add user management page** - Let admins create more users
2. **Forget password feature** - Allow password resets
3. **Two-factor authentication** - Add TOTP/SMS 2FA
4. **.../admin/members page** - Make it functional to manage users
5. **Role-based access control** - Different pages for different roles

---

**Status**: ✅ **Ready for testing and production deployment**

Questions? Check AUTH_SETUP.md for detailed instructions.
