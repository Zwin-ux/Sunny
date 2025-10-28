import { UserProfile } from '@/types/user';
import fs from 'fs/promises';
import path from 'path';
import { isDemoMode } from './runtimeMode';

const DB_FILE = path.resolve(process.cwd(), 'src/data/db/users.json');

export async function getUsers(): Promise<UserProfile[]> {
  try {
    if (isDemoMode()) {
      return [];
    }
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File does not exist, return empty array
      return [];
    }
    console.error('Error reading users database:', error);
    throw error;
  }
}

export async function saveUsers(users: UserProfile[]): Promise<void> {
  try {
    if (isDemoMode()) {
      return;
    }
    await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users database:', error);
    throw error;
  }
}

export async function getUserById(id: string): Promise<UserProfile | undefined> {
  const users = await getUsers();
  return users.find(user => user.id === id);
}

export async function saveUser(userToSave: UserProfile): Promise<void> {
  if (isDemoMode()) {
    return;
  }
  const users = await getUsers();
  const index = users.findIndex(user => user.id === userToSave.id);

  if (index !== -1) {
    users[index] = userToSave;
  } else {
    users.push(userToSave);
  }
  await saveUsers(users);
}