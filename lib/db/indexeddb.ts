import { updateTimestamp, withTimestamps } from "../utils/date"
import { generateId } from "../utils/general"

const DB_NAME = "StorageManagementDB"
const DB_VERSION = 5

export const STORES = {
  USERS: "users",
  FILES: "files",
  FOLDERS: "folders",
  SESSIONS: "sessions",
  ACCOUNTS: "accounts",
  SHARES: "shares",
} as const

type StoreName = typeof STORES[keyof typeof STORES]

export type AuthProvider = "credentials" | "google"

export interface User {
  id: string
  name: string
  email: string
  passwordHash?: string
  provider: AuthProvider
  accountId: string
  createdAt?: string
  updatedAt?: string
}

export interface FileDocument {
  id: string
  type: FileType
  name: string
  url: string
  extension: string
  size: number
  owner: string
  accountId: string
  bucketFileId: string
  parentId: string | null
  createdAt?: string
  updatedAt?: string
}

export interface FolderDocument {
  id: string
  name: string
  parentId: string | null
  owner: string
  accountId: string
  createdAt?: string
  updatedAt?: string
}

export interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  accountId?: string
  createdAt?: string
}

export interface Account {
  id: string
  userId: string
  type: string
  provider: string
  providerAccountId: string
  refresh_token?: string
  access_token?: string
  expires_at?: number
  token_type?: string
  scope?: string
  id_token?: string
  createdAt?: string
}

export interface Share {
  id: string
  fileId: string
  ownerId: string
  sharedWithEmail: string
  sharedWithUserId?: string
  permission: 'view'
  createdAt?: string
  updatedAt?: string
}


class IndexedDBService {
  private db: IDBDatabase | null = null

  private isSupported() {
    return typeof window !== "undefined" && typeof indexedDB !== "undefined"
  }

  async init(): Promise<void> {
    if (this.db || !this.isSupported()) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = ({ target }) => {
        const db = (target as IDBOpenDBRequest).result

        const createStore = (
          name: StoreName,
          keyPath = "id",
          indexes: Array<[string, string, boolean?]> = []
        ) => {
          if (db.objectStoreNames.contains(name)) return
          const store = db.createObjectStore(name, { keyPath })
          indexes.forEach(([idx, key, unique]) =>
            store.createIndex(idx, key, { unique })
          )
        }

        createStore(STORES.USERS, "id", [
          ["email", "email", true],
          ["accountId", "accountId"],
        ])

        createStore(STORES.FILES, "id", [
          ["owner", "owner"],
          ["type", "type"],
          ["name", "name"],
          ["accountId", "accountId"],
          ["parentId", "parentId"],
        ])

        createStore(STORES.FOLDERS, "id", [
          ["owner", "owner"],
          ["accountId", "accountId"],
          ["parentId", "parentId"],
        ])

        createStore(STORES.SESSIONS, "id", [
          ["userId", "userId"],
          ["accountId", "accountId"],
          ["sessionToken", "sessionToken", true],
        ])

        createStore(STORES.ACCOUNTS, "id", [
          ["userId", "userId"],
          ["provider", "provider"],
          ["providerAccountId", "providerAccountId"],
        ])

        createStore(STORES.SHARES, "id", [
          ["fileId", "fileId"],
          ["ownerId", "ownerId"],
          ["sharedWithEmail", "sharedWithEmail"],
          ["sharedWithUserId", "sharedWithUserId"],
        ])
      }
    })
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error("IndexedDB not supported")
    }

    if (!this.db) await this.init()
    if (!this.db) throw new Error("Failed to initialize DB")

    return this.db
  }

  private async run<T>(
    storeName: StoreName,
    mode: IDBTransactionMode,
    cb: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      const request = cb(store)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  add<T>(store: StoreName, data: T) {
    return this.run<string>(store, "readwrite", s => s.add(data))
  }

  get<T>(store: StoreName, id: string) {
    return this.run<T | undefined>(store, "readonly", s => s.get(id))
  }

  getAll<T>(store: StoreName) {
    return this.run<T[]>(store, "readonly", s => s.getAll())
  }

  update<T>(store: StoreName, data: T) {
    return this.run<void>(store, "readwrite", s => s.put(data))
  }

  delete(store: StoreName, id: string) {
    return this.run<void>(store, "readwrite", s => s.delete(id))
  }

  async getByIndex<T>(
    store: StoreName,
    index: string,
    value: string
  ): Promise<T[]> {
    return this.run<T[]>(store, "readonly", s =>
      s.index(index).getAll(value)
    )
  }

  async getAllFilesByUser(userId: string): Promise<FileDocument[]> {
    return this.getByIndex<FileDocument>(STORES.FILES, "owner", userId)
  }

  async getAllFoldersByUser(userId: string): Promise<FolderDocument[]> {
    return this.getByIndex<FolderDocument>(STORES.FOLDERS, "owner", userId)
  }

  async getAllFilesByAccount(accountId: string): Promise<FileDocument[]> {
    return this.getByIndex<FileDocument>(STORES.FILES, "accountId", accountId)
  }

  async getAllFoldersByAccount(accountId: string): Promise<FolderDocument[]> {
    return this.getByIndex<FolderDocument>(STORES.FOLDERS, "accountId", accountId)
  }


  async getUserByEmail(email: string) {
    return (await this.getByIndex<User>(STORES.USERS, "email", email))[0]
  }

  async createUser(data: Omit<User, "id" | "createdAt" | "updatedAt">) {
    const user = withTimestamps({ id: generateId(), ...data })
    await this.add(STORES.USERS, user)
    return user
  }

  async updateUserPassword(userId: string, passwordHash: string) {
    const user = await this.get<User>(STORES.USERS, userId)
    if (!user) return
    await this.update(STORES.USERS, updateTimestamp({ ...user, passwordHash }))
  }

  async createSession(data: Omit<Session, "id" | "createdAt">) {
    const session = withTimestamps({ id: generateId(), ...data })
    await this.add(STORES.SESSIONS, session)
    return session
  }

  async getSessionByToken(token: string) {
    return (await this.getByIndex<Session>(
      STORES.SESSIONS,
      "sessionToken",
      token
    ))[0]
  }

  async clearExpiredSessions() {
    const now = new Date()
    const sessions = await this.getAll<Session>(STORES.SESSIONS)

    await Promise.all(
      sessions
        .filter(s => s.expires < now)
        .map(s => this.delete(STORES.SESSIONS, s.id))
    )
  }

  async getSharesByFileId(fileId: string): Promise<Share[]> {
    return this.getByIndex<Share>(STORES.SHARES, "fileId", fileId)
  }

  async getSharesByOwnerId(ownerId: string): Promise<Share[]> {
    return this.getByIndex<Share>(STORES.SHARES, "ownerId", ownerId)
  }

  async getSharesByEmail(email: string): Promise<Share[]> {
    return this.getByIndex<Share>(STORES.SHARES, "sharedWithEmail", email)
  }

  async getSharesByUserId(userId: string): Promise<Share[]> {
    return this.getByIndex<Share>(STORES.SHARES, "sharedWithUserId", userId)
  }
}

export const db = new IndexedDBService()
