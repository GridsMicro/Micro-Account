// =====================================================
// Micro-Account: Company Settings API
// RESTful API for company branding and configuration
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { getCompanySettings, updateCompanySettings } from '@/lib/settings';

// GET company settings
export async function GET() {
  try {
    const result = await getCompanySettings();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT company settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateCompanySettings(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: body
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
