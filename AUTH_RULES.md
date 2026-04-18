# AUTHENTICATION SYSTEM RULES - SUPREME
## ห้ามละเมิดเด็ดขาด

### ❌ FORBIDDEN (ห้ามใช้เด็ดขาด)
1. **next-auth library** - ทุก version (v4, v5, beta)
2. **./middleware.ts** - ห้ามสร้าง/ใช้
3. **next-auth/react** - ห้าม import (useSession, signIn, signOut)
4. **useSession() hook** - ห้ามใช้ใน component ใดๆ

### ✅ MANDATORY (ต้องใช้เท่านั้น)
1. **./proxy.ts** - สำหรับ route protection เท่านั้น
2. **Custom JWT** ด้วย `jose` library (ไม่ใช่ jsonwebtoken)
3. **bcryptjs** - สำหรับ password hashing
4. **Cookie**: "session-token" (httpOnly, secure, sameSite=lax)

### 📁 PROTECTED FILES
ห้ามแก้ไขไฟล์เหล่านี้โดยไม่ได้รับอนุญาต:
- `lib/auth.ts`
- `proxy.ts`
- `app/api/login/route.ts`
- `app/api/logout/route.ts`
- `components/Providers.tsx`

### 🌐 PUBLIC PATHS (ไม่ต้อง login)
- /login
- /register
- /api/login
- /api/logout
- /api/auth/*

### 🔐 AUTH FLOW
1. Login page → POST /api/login
2. API ตรวจสอบ password ด้วย bcrypt
3. สร้าง JWT ด้วย jose (หมดอายุ 1 วัน)
4. ตั้งค่า cookie "session-token"
5. proxy.ts ตรวจสอบ JWT ทุก request
6. Token ไม่ถูกต้อง/ไม่มี → redirect ไป /login

### 📝 CLIENT COMPONENT PATTERN
```tsx
// ✅ ถูกต้อง: รับ userRole จาก Server Component
export default function MyComponent({ userRole }: { userRole?: string }) {
  // ใช้ userRole ได้เลย
}

// ❌ ผิด: ห้ามใช้ useSession
const { data: session } = useSession(); // BANNED!
```

### 🚪 LOGOUT PATTERN
```tsx
// ✅ ถูกต้อง
<button onClick={async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}}>
  Logout
</button>
```

---
**Created**: 2024-04-17
**Status**: SUPREME RULES - NEVER VIOLATE
