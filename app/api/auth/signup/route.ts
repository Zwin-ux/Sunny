import { NextResponse } from 'next/server';
import { addUser, findUserByEmail } from '@/lib/db';
import { UserProfile } from '@/types/user';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const { name, email, password } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: UserProfile = {
    id: randomUUID(),
    name,
    email,
    passwordHash,
    learningStyle: undefined,
    progress: {},
    chatHistory: []
  };
  await addUser(newUser);
  return NextResponse.json({ ok: true });
}
