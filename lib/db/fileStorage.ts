const FILE_DB_NAME = "FileStorageDB"
const FILE_DB_VERSION = 1
const FILE_STORE = "fileBlobs"

export interface StoredFile {
  id: string
  blob: Blob
  name: string
  size: number
  type: string
  uploadedAt: string
}

class FileStorageService {
  private db: IDBDatabase | null = null

  private isSupported() {
    return typeof window !== "undefined" && "indexedDB" in window
  }

  async init(): Promise<void> {
    if (this.db || !this.isSupported()) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(FILE_DB_NAME, FILE_DB_VERSION)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = ({ target }) => {
        const db = (target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          db.createObjectStore(FILE_STORE, { keyPath: "id" })
        }
      }
    })
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error("IndexedDB not supported")
    }

    if (!this.db) await this.init()
    if (!this.db) {
      throw new Error("Failed to initialize FileStorage DB")
    }

    return this.db
  }

  private async run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    const db = await this.getDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, mode)
      const store = tx.objectStore(FILE_STORE)
      const request = action(store)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async storeFile(id: string, file: File) {
    const record: StoredFile = {
      id,
      blob: file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    }

    await this.run<void>("readwrite", store => store.put(record))
  }

  getFile(id: string) {
    return this.run<StoredFile | undefined>("readonly", store =>
      store.get(id)
    )
  }

  deleteFile(id: string) {
    return this.run<void>("readwrite", store => store.delete(id))
  }

  async getFileUrl(id: string): Promise<string | null> {
    const file = await this.getFile(id)
    return file ? URL.createObjectURL(file.blob) : null
  }

  getAllFiles() {
    return this.run<StoredFile[]>("readonly", store => store.getAll())
  }
}

export const fileStorage = new FileStorageService()
