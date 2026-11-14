import { Box, CircularProgress, Typography } from '@mui/material'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import { getSyncState, subscribeSync } from '../utils/sync'

// How long the server may take before the indicator appears: a normal answer takes milliseconds, so a quick request
// doesn't flash it.
const SHOW_AFTER_MS = 1500
const SYNCED_MS = 2500

const plural = (count) => `${count} ${count === 1 ? 'change' : 'changes'}`

// A small note in the bottom-left corner about the server and unsent changes: it wakes up (Render's free tier), the
// saved data is shown meanwhile, changes wait in the outbox and go out by themselves.
function SyncStatus() {
    const { pending, syncing, waiting } = useSyncExternalStore(subscribeSync, getSyncState)
    const busy = waiting || syncing

    const [isSlow, setIsSlow] = useState(false)
    useEffect(() => {
        if (!busy) {
            setIsSlow(false)
            return undefined
        }
        const timer = setTimeout(() => setIsSlow(true), SHOW_AFTER_MS)
        return () => clearTimeout(timer)
    }, [busy])

    // "All changes synced" for a moment after the outbox empties
    const [justSynced, setJustSynced] = useState(false)
    const hadPending = useRef(false)
    useEffect(() => {
        if (pending > 0) {
            hadPending.current = true
            setJustSynced(false)
            return undefined
        }
        if (!hadPending.current) return undefined
        hadPending.current = false
        setJustSynced(true)
        const timer = setTimeout(() => setJustSynced(false), SYNCED_MS)
        return () => clearTimeout(timer)
    }, [pending])

    let text = null
    let inProgress = true
    if (pending > 0) {
        text = isSlow && waiting
            ? `Server is waking up · ${plural(pending)} will sync automatically`
            : `Syncing ${plural(pending)}…`
    } else if (waiting && isSlow) {
        text = 'Server is waking up · showing saved data'
    } else if (justSynced) {
        text = 'All changes synced'
        inProgress = false
    }

    if (!text) return null

    return (
        <Box
            role="status"
            aria-live="polite"
            sx={{
                position: 'fixed',
                left: 16,
                // Above the mobile bottom nav; the right side is taken by the scroll-to-top button
                bottom: { xs: 'calc(56px + 16px + env(safe-area-inset-bottom))', sm: 24 },
                maxWidth: 'calc(100% - 96px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 2,
                bgcolor: 'overlay.strong',
                color: 'overlay.onImage',
            }}
        >
            {inProgress
                ? <CircularProgress size={14} color="inherit" thickness={5} />
                : <CheckIcon sx={{ fontSize: 16 }} />}
            <Typography variant="caption" sx={{ color: 'inherit', lineHeight: 1.3 }}>
                {text}
            </Typography>
        </Box>
    )
}

export default SyncStatus
