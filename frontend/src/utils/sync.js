// Working while the server is asleep (Render's free tier takes up to a minute to wake) or unreachable:
//  - readThrough shows the last known server data at once and swaps in fresh data when the server answers;
//  - the outbox keeps unsent changes (saved on disk, so a reload or a closed tab doesn't lose them) and sends them in
//    order as soon as the server is back.
import instance from '../axios'
import { alertError } from '../alerts'
import { kvGet, kvSet } from './idb'

const OUTBOX_KEY = 'outbox'
const RETRY_MS = 8000
export const SYNC_FAILED_EVENT = 'movielist:sync-failed'

// ---- status (for the indicator) ----
let state = { pending: 0, syncing: false, waiting: false }
let readsWaiting = 0
let outboxWaiting = false
const listeners = new Set()

function publish(patch = {}) {
    state = { ...state, ...patch, waiting: readsWaiting > 0 || outboxWaiting }
    listeners.forEach((listener) => listener())
}
export const subscribeSync = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
export const getSyncState = () => state

// ---- outbox ----
let queue = []
let userId = null
let loading = null
let flushing = false
let retryTimer = null

const mine = () => queue.filter((op) => op.userId === userId)
const persist = () => kvSet(OUTBOX_KEY, queue)

function loadQueue() {
    if (!loading) {
        loading = kvGet(OUTBOX_KEY).then((saved) => {
            queue = [...(Array.isArray(saved) ? saved : []), ...queue]
            publish({ pending: mine().length })
        })
    }
    return loading
}

// Unsent ops of a user, to show their effect over server data.
export async function getPendingOps(forUserId) {
    await loadQueue()
    return queue.filter((op) => op.userId === forUserId)
}

// The ops sent on behalf of this user; the outbox of another account never goes out under this account's token.
export function setSyncUser(id) {
    userId = id || null
    loadQueue().then(() => {
        publish({ pending: mine().length })
        flush()
    })
}

export async function enqueue(forUserId, op) {
    userId = forUserId
    await loadQueue()
    queue.push({ ...op, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId: forUserId, createdAt: Date.now() })
    publish({ pending: mine().length })
    await persist()
    flush()
}

// Server asleep / unreachable / session problem: the op stays and goes out later. Anything else is a rejection for
// good (the item is gone, bad data): retrying won't help.
const isRetriable = (error) => {
    const status = error.response?.status
    return !status || status >= 500 || status === 408 || status === 429 || status === 401
}

async function flush() {
    if (flushing) return
    await loadQueue()
    if (!userId || !mine().length) return

    flushing = true
    clearTimeout(retryTimer)
    publish({ syncing: true })
    let retry = false
    try {
        for (let op = mine()[0]; op; op = mine()[0]) {
            try {
                // No timeout: while the server wakes up the request just waits and then succeeds
                await instance.request(op.request)
                queue = queue.filter((item) => item.id !== op.id)
                outboxWaiting = false
            } catch (error) {
                if (isRetriable(error)) {
                    retry = true
                    break
                }
                queue = queue.filter((item) => item.id !== op.id)
                console.warn(error)
                alertError(error, "A change couldn't be saved")
                window.dispatchEvent(new Event(SYNC_FAILED_EVENT))
            }
            await persist()
            publish({ pending: mine().length })
        }
    } finally {
        flushing = false
        outboxWaiting = retry
        publish({ syncing: false, pending: mine().length })
        if (retry) retryTimer = setTimeout(flush, RETRY_MS)
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('online', flush)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') flush()
    })
}

// ---- reads ----
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Changes the saved answer of a read in place, so a change that has already gone out is still in it when the server is
// unreachable the next time (the saved answer would otherwise predate the change).
export async function updateCached(key, change) {
    const saved = await kvGet(key)
    if (saved) await kvSet(key, { ...saved, data: change(saved.data) })
}

// Calls onData(data, { stale: true }) at once with the last known response (if any), then onData(data, { stale: false })
// when the request succeeds; the returned promise resolves after the second call. While the server doesn't answer and
// there is saved data to show, it keeps retrying; without saved data (or on a real error such as 401) the error is
// thrown, as for a plain request.
export async function readThrough({ key, request, onData, isCancelled = () => false }) {
    const saved = await kvGet(key)
    if (isCancelled()) return

    let released = !saved
    const release = () => {
        if (released) return
        released = true
        readsWaiting -= 1
        publish()
    }
    if (saved) {
        // Not awaited: the request starts right away
        Promise.resolve(onData(saved.data, { stale: true, savedAt: saved.savedAt })).catch((error) => console.warn(error))
        readsWaiting += 1
        publish()
    }

    let data
    try {
        for (;;) {
            try {
                data = await request()
                break
            } catch (error) {
                if (isCancelled()) return
                if (!saved || !isRetriable(error) || error.response?.status === 401) throw error
                await wait(RETRY_MS)
                if (isCancelled()) return
            }
        }
    } finally {
        release()
    }

    if (isCancelled()) return
    kvSet(key, { data, savedAt: Date.now() })
    await onData(data, { stale: false })
}
