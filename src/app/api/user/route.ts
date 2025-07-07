import { NextResponse } from 'next/server';
import { getUserById, saveUser } from '@/lib/db';
import { UserProfile } from '@/types/user';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const user = await getUserById(id);
    if (user) {
      return NextResponse.json(user);
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userData: UserProfile = await request.json();

    if (!userData.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await saveUser(userData);
    return NextResponse.json({ message: 'User data saved successfully' });
  } catch (error) {
    console.error('Error saving user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
