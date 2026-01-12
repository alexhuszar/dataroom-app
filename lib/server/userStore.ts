/**
 * Server-Side User Store (In-Memory)
 *
 * This store manages user credentials for authentication.
 * - Runs only on the server (Node.js)
 * - Uses in-memory Map (data lost on server restart)
 * - Handles both email/password and OAuth users
 *
 * NOTE: This is NOT IndexedDB - it's a simple Map in server memory.
 * For production, consider persisting to a file or database.
 */

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  provider: 'credentials' | 'google';
  createdAt: string;
}

class UserStore {
  private users: Map<string, StoredUser> = new Map();


  async getUserByEmail(email: string): Promise<StoredUser | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserById(id: string): Promise<StoredUser | undefined> {
    return Array.from(this.users.values()).find(u => u.id === id);
  }

  async createUser(userData: Omit<StoredUser, 'id' | 'createdAt'>): Promise<StoredUser> {
    const user: StoredUser = {
      id: crypto.randomUUID(),
      ...userData,
      createdAt: new Date().toISOString()
    };

    this.users.set(user.email, user);
    console.log(`User created in memory: ${user.email} (${user.provider})`);

    return user;
  }

  async updateUser(email: string, updates: Partial<StoredUser>): Promise<void> {
    const user = this.users.get(email);
    if (user) {
      this.users.set(email, { ...user, ...updates });
      console.log(`User updated: ${email}`);
    }
  }


  async deleteUser(email: string): Promise<void> {
    this.users.delete(email);
    console.log(`User deleted: ${email}`);
  }


  async getAllUsers(): Promise<StoredUser[]> {
    return Array.from(this.users.values());
  }


  getUserCount(): number {
    return this.users.size;
  }
}

export const userStore = new UserStore();
