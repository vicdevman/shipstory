import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, received: body });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}
