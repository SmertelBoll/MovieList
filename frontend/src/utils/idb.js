// A tiny key-value store on IndexedDB for data that outgrows localStorage: the last known server data and the outbox of
// unsent changes. Without IndexedDB (private mode, blocked storage) it falls back to memory: nothing survives a reload
// then, but the app keeps working.
const DB_NAME = 'movielist-offline'
const STORE = 'kv'

const memory = new Map()
let dbPromise = null

function openDb() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve) => {
            try {
                const request = indexedDB.open(DB_NAME, 1)
                request.onupgradeneeded = () => request.result.createObjectStore(STORE)
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => resolve(null)
                request.onblocked = () => resolve(null)
            } catch {
                resolve(null)
            }
        })
    }
    return dbPromise
}

// Runs one request in a transaction; null when IndexedDB is unavailable or the request failed.
async function run(mode, makeRequest) {
    const db = await openDb()
    if (!db) return { ok: false }
    return new Promise((resolve) => {
        try {
            const request = makeRequest(db.transaction(STORE, mode).objectStore(STORE))
            request.onsuccess = () => resolve({ ok: true, value: request.result })
            request.onerror = () => resolve({ ok: false })
        } catch {
            resolve({ ok: false })
        }
    })
}

export async function kvGet(key) {
    const result = await run('readonly', (store) => store.get(key))
    return result.ok ? result.value : memory.get(key)
}

export async function kvSet(key, value) {
    memory.set(key, value)
    await run('readwrite', (store) => store.put(value, key))
}

export async function kvDelete(key) {
    memory.delete(key)
    await run('readwrite', (store) => store.delete(key))
}
