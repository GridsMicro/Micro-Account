# ปัญหา Login - สาเหตุและวิธีแก้ไข

## วันที่: 2024-04-17
## สถานะ: แก้ไขแล้ว ✅

---

## 🔴 ปัญหา (Problem)
- Login ไม่ได้บน Local Development
- Error: `ClientFetchError: Failed to fetch`
- หน้าจอค้างที่ /login ไม่ redirect ไปหน้าหลัก

---

## 🔍 สาเหตุ (Root Cause)

### 1. next-auth v5 beta ไม่เข้ากับ Next.js 16
- `POST /api/auth/callback/credentials` ไม่ถึง server เลย
- Error เกิดก่อนถึงฟังก์ชัน `authorize()`
- next-auth v5 beta มี bug กับ Next.js 16 App Router

### 2. Conflict กับ proxy.ts
- proxy.ts ใช้ NextAuth อยู่
- ระบบ custom auth ที่สร้างใหม่ conflict กับ next-auth

---

## ✅ วิธีแก้ไข (Solution)

### ขั้นตอนที่ 1: ลบ next-auth ทั้งหมด
- ไม่ใช้ next-auth library อีกต่อไป
- ไม่ใช้ `useSession`, `signIn`, `signOut` จาก `next-auth/react`
- ไม่ใช้ `./middleware.ts` (ตามกฎที่มีอยู่แล้ว)

### ขั้นตอนที่ 2: สร้างระบบ Custom JWT

#### ไฟล์หลัก:
1. **lib/auth.ts**
   - `verifyToken()` - ตรวจสอบ JWT
   - `auth()` - ดึง session จาก cookie
   - `createToken()` - สร้าง JWT
   - ใช้ library `jose` (ไม่ใช่ jsonwebtoken)

2. **app/api/login/route.ts**
   - รับ email, password
   - ตรวจสอบด้วย bcrypt
   - สร้าง JWT + ตั้ง cookie

3. **app/api/logout/route.ts**
   - ลบ cookie "session-token"

4. **proxy.ts**
   - ตรวจสอบ JWT ทุก request
   - Public paths: /login, /register, /api/login, /api/logout
   - ไม่มี token → redirect ไป /login

### ขั้นตอนที่ 3: แก้ไข Components

#### เปลี่ยนการเข้าถึงข้อมูล user:
```tsx
// ❌ เก่า: ใช้ useSession (BANNED!)
const { data: session } = useSession();
const role = session?.user?.role;

// ✅ ใหม่: รับผ่าน props
export default function Component({ userRole }: { userRole?: string }) {
  // ใช้ userRole ได้เลย
}
```

#### เปลี่ยน Logout:
```tsx
// ❌ เก่า: signOut จาก next-auth
<button onClick={() => signOut()}>Logout</button>

// ✅ ใหม่: custom logout
<button onClick={async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}}>Logout</button>
```

#### เปลี่ยน Login:
```tsx
// ❌ เก่า: signIn จาก next-auth
const result = await signIn("credentials", { email, password });

// ✅ ใหม่: fetch API เอง
const res = await fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (res.ok) window.location.href = "/";
```

---

## 📝 ไฟล์ที่แก้ไข (Modified Files)

### Core Authentication:
- `lib/auth.ts` - เปลี่ยนเป็น Custom JWT
- `proxy.ts` - เปลี่ยนเป็น Custom JWT validation
- `app/api/login/route.ts` - สร้างใหม่
- `app/api/logout/route.ts` - สร้างใหม่
- `components/Providers.tsx` - ลบ SessionProvider

### Components (ลบ useSession):
- `app/login/page.tsx` - ใช้ fetch /api/login
- `app/invoices/InvoiceRowActions.tsx` - รับ userRole ผ่าน props
- `app/recurring/RecurringRunButton.tsx` - รับ userRole ผ่าน props
- `components/Sidebar.tsx` - custom logout
- `components/WaitingRoom.tsx` - custom logout

### Pages (ส่ง userRole ไปให้ components):
- `app/invoices/page.tsx` - เรียก auth() + ส่ง userRole
- `app/recurring/page.tsx` - เรียก auth() + ส่ง userRole

---

## 🔐 รายละเอียดระบบใหม่

### Cookie:
- ชื่อ: `session-token`
- httpOnly: true
- secure: true (production)
- sameSite: lax
- อายุ: 1 วัน

### JWT:
- Library: jose
- Algorithm: HS256
- Secret: NEXTAUTH_SECRET หรือ AUTH_SECRET
- Payload: { id, email, name, role }

### Public Paths (ไม่ต้อง login):
- /login
- /register
- /api/login
- /api/logout
- /api/auth/*

---

## 🎯 ผลลัพธ์ (Result)
- ✅ Login ได้แล้ว
- ✅ Redirect ไป / หลัง login สำเร็จ
- ✅ Logout ทำงานถูกต้อง
- ✅ ทุกหน้าป้องกันโดย proxy.ts
- ✅ ไม่มี next-auth แล้ว

---

## 📚 อ้างอิงกฎ (Related Rules)
- ดู `AUTH_RULES.md` - กฎสูงสุดเรื่อง authentication
- ห้ามใช้ middleware.ts - ใช้ proxy.ts เท่านั้น
