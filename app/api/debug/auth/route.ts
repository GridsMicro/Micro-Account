import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // 1. Check database connection
    const testRes = await query("SELECT NOW()");
    
    // 2. Check users table
    const userRes = await query(
      "SELECT id, email, password, name, role, status FROM users WHERE email = $1",
      [email]
    );
    
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "User not found", db: "OK" }, { status: 404 });
    }
    
    const user = userRes.rows[0];
    
    // 3. Check password
    const match = await bcrypt.compare(password, user.password);
    
    return NextResponse.json({
      success: match,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      db: "OK",
      passwordMatch: match
    });
    
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message,
      stack: err.stack 
    }, { status: 500 });
  }
}
