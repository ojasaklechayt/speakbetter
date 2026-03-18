const DATABASE_NAME = 'SpeakBetter'
const DATABASE_VERSION = 1

export class IndexedDbDriver {
  private dbPromise: Promise<IDBDatabase> | null = null

  openDatabase() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

        request.onerror = () => {
          reject(request.error ?? new Error('Failed to open IndexedDB.'))
        }

        request.onupgradeneeded = () => {
          const database = request.result

          this.ensureStore(database, 'auth')
          this.ensureStore(database, 'sessions')
        }

        request.onsuccess = () => {
          resolve(request.result)
        }
      })
    }

    return this.dbPromise
  }

  async add(storeName: string, value: unknown) {
    const store = await this.getObjectStore(storeName, 'readwrite')
    await this.awaitRequest(store.add(value))
  }

  async put(storeName: string, value: unknown) {
    const store = await this.getObjectStore(storeName, 'readwrite')
    await this.awaitRequest(store.put(value))
  }

  async get<T>(storeName: string, key: IDBValidKey) {
    const store = await this.getObjectStore(storeName, 'readonly')
    const result = await this.awaitRequest<T | undefined>(store.get(key))
    return result ?? null
  }

  async getAll<T>(storeName: string) {
    const store = await this.getObjectStore(storeName, 'readonly')
    const result = await this.awaitRequest<T[]>(store.getAll())
    return result ?? []
  }

  private ensureStore(database: IDBDatabase, storeName: string) {
    if (!database.objectStoreNames.contains(storeName)) {
      database.createObjectStore(storeName, { keyPath: 'id' })
    }
  }

  private async getObjectStore(
    storeName: string,
    mode: IDBTransactionMode,
  ) {
    const database = await this.openDatabase()
    const transaction = database.transaction(storeName, mode)

    return transaction.objectStore(storeName)
  }

  private awaitRequest<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
      request.onerror = () => {
        reject(request.error ?? new Error('IndexedDB request failed.'))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  }
}
