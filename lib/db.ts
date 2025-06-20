import { promises as fs } from 'fs';
import { UserProfile } from '@/types/user';

const USERS_FILE = process.cwd() + '/db/users.json';

export async function getUsers(): Promise<UserProfile[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveUsers(users: UserProfile[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export async function findUserByEmail(email: string): Promise<UserProfile | undefined> {
  const users = await getUsers();
  return users.find(u => u.email === email);
}

export async function addUser(user: UserProfile): Promise<void> {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
}
