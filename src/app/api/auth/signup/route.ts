
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/types/ehr';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password, plan, clinicName } = (await request.json()) as Omit<User, 'id'> & { password?: string };

    if (!password) {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 });
    }

    const existingUser = await db.findUser(username);
    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }
    
    const newUser = await db.createUser({ username, password: password, plan, clinicName });

    return NextResponse.json(newUser, { status: 201 });

  } catch (error) {
    console.error("Signup error:", error);
    const e = error as Error;
    return NextResponse.json({ message: e.message || 'An error occurred during signup' }, { status: 500 });
  }
}
