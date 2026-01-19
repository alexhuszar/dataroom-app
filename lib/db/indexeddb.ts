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

// Private state (module-scoped)
let dbInstance: IDBDatabase | null = null

// Private helper functions
const isSupported = (): boolean =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined"

const getDB = async (): Promise<IDBDatabase> => {
  if (!isSupported()) {
    throw new Error("IndexedDB not supported")
  }

  if (!dbInstance) await init()
  if (!dbInstance) throw new Error("Failed to initialize DB")

  return dbInstance
}

const run = async <T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  cb: (store: IDBObjectStore) => IDBRequest
): Promise<T> => {
  const database = await getDB()

  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = cb(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Public functions
const init = async (): Promise<void> => {
  if (dbInstance || !isSupported()) return

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve()
    }

    request.onupgradeneeded = ({ target }) => {
      const database = (target as IDBOpenDBRequest).result

      const createStore = (
        name: StoreName,
        keyPath = "id",
        indexes: Array<[string, string, boolean?]> = []
      ) => {
        if (database.objectStoreNames.contains(name)) return
        const store = database.createObjectStore(name, { keyPath })
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

const add = <T>(store: StoreName, data: T) =>
  run<string>(store, "readwrite", s => s.add(data))

const get = <T>(store: StoreName, id: string) =>
  run<T | undefined>(store, "readonly", s => s.get(id))

const getAll = <T>(store: StoreName) =>
  run<T[]>(store, "readonly", s => s.getAll())

const update = <T>(store: StoreName, data: T) =>
  run<void>(store, "readwrite", s => s.put(data))

const deleteRecord = (store: StoreName, id: string) =>
  run<void>(store, "readwrite", s => s.delete(id))

const getByIndex = async <T>(
  store: StoreName,
  index: string,
  value: string
): Promise<T[]> =>
  run<T[]>(store, "readonly", s => s.index(index).getAll(value))

const getAllFilesByUser = async (userId: string): Promise<FileDocument[]> =>
  getByIndex<FileDocument>(STORES.FILES, "owner", userId)

const getAllFoldersByUser = async (userId: string): Promise<FolderDocument[]> =>
  getByIndex<FolderDocument>(STORES.FOLDERS, "owner", userId)

const getAllFilesByAccount = async (accountId: string): Promise<FileDocument[]> =>
  getByIndex<FileDocument>(STORES.FILES, "accountId", accountId)

const getAllFoldersByAccount = async (accountId: string): Promise<FolderDocument[]> =>
  getByIndex<FolderDocument>(STORES.FOLDERS, "accountId", accountId)

const getUserByEmail = async (email: string) =>
  (await getByIndex<User>(STORES.USERS, "email", email))[0]

const createUser = async (data: Omit<User, "id" | "createdAt" | "updatedAt">) => {
  const user = withTimestamps({ id: generateId(), ...data })
  await add(STORES.USERS, user)
  return user
}

const updateUserPassword = async (userId: string, passwordHash: string) => {
  const user = await get<User>(STORES.USERS, userId)
  if (!user) return
  await update(STORES.USERS, updateTimestamp({ ...user, passwordHash }))
}

const createSession = async (data: Omit<Session, "id" | "createdAt">) => {
  const session = withTimestamps({ id: generateId(), ...data })
  await add(STORES.SESSIONS, session)
  return session
}

const getSessionByToken = async (token: string) =>
  (await getByIndex<Session>(STORES.SESSIONS, "sessionToken", token))[0]

const clearExpiredSessions = async () => {
  const now = new Date()
  const sessions = await getAll<Session>(STORES.SESSIONS)

  await Promise.all(
    sessions
      .filter(s => s.expires < now)
      .map(s => deleteRecord(STORES.SESSIONS, s.id))
  )
}

const getSharesByFileId = async (fileId: string): Promise<Share[]> =>
  getByIndex<Share>(STORES.SHARES, "fileId", fileId)

const getSharesByOwnerId = async (ownerId: string): Promise<Share[]> =>
  getByIndex<Share>(STORES.SHARES, "ownerId", ownerId)

const getSharesByEmail = async (email: string): Promise<Share[]> =>
  getByIndex<Share>(STORES.SHARES, "sharedWithEmail", email)

const getSharesByUserId = async (userId: string): Promise<Share[]> =>
  getByIndex<Share>(STORES.SHARES, "sharedWithUserId", userId)

// Testing helper to reset state
export const _resetForTesting = () => {
  dbInstance = null
}

// Export for testing private function
export const _getDBForTesting = getDB

// Backward-compatible db object export
export const db = {
  init,
  add,
  get,
  getAll,
  update,
  delete: deleteRecord,
  getByIndex,
  getUserByEmail,
  createUser,
  updateUserPassword,
  getAllFilesByUser,
  getAllFoldersByUser,
  getAllFilesByAccount,
  getAllFoldersByAccount,
  createSession,
  getSessionByToken,
  clearExpiredSessions,
  getSharesByFileId,
  getSharesByOwnerId,
  getSharesByEmail,
  getSharesByUserId,
}
