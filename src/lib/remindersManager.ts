import { supabase } from './supabase'

export interface Reminder {
  id: string
  user_id: string
  habit_id: string
  reminder_type: string
  reminder_time: string // "HH:MM:SS"
  reminder_days: number[] // 0=Sun..6=Sat
  message: string
  is_active: boolean
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  habits?: {
    name: string
    tiny_goal: string
    frequency: string
    custom_days: number[]
  }
}

/**
 * Fetches all active reminders for the logged-in user.
 */
export async function fetchActiveReminders(userId: string): Promise<Reminder[]> {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*, habits(name, tiny_goal, frequency, custom_days)')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    return (data as any[]) || []
  } catch (err) {
    console.error('Error loading reminders:', err)
    return []
  }
}

/**
 * Helper to convert "HH:MM" or "HH:MM:SS" to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':')
  const h = parseInt(parts[0], 10) || 0
  const m = parseInt(parts[1], 10) || 0
  return h * 60 + m
}

/**
 * Checks if the current time falls within quiet hours (respecting midnight crossing).
 */
export function isWithinQuietHours(
  currentTimeStr: string, // "HH:MM"
  start?: string | null,  // "HH:MM:SS" or "HH:MM"
  end?: string | null
): boolean {
  if (!start || !end) return false

  const cur = timeToMinutes(currentTimeStr)
  const s = timeToMinutes(start)
  const e = timeToMinutes(end)

  if (s < e) {
    return cur >= s && cur <= e
  } else {
    // Crosses midnight (e.g. 22:00 to 07:00)
    return cur >= s || cur <= e
  }
}

/**
 * Checks if a reminder is currently due or coming up soon.
 * Rules:
 * - Today is a scheduled day.
 * - Current time is not inside quiet hours.
 * - Reminder time was in the last 60 minutes or is in the next 15 minutes.
 */
export function getDueReminders(reminders: Reminder[]): Reminder[] {
  const now = new Date()
  const currentDayIdx = now.getDay() // 0=Sun, 1=Mon...6=Sat
  const currentHours = String(now.getHours()).padStart(2, '0')
  const currentMinutes = String(now.getMinutes()).padStart(2, '0')
  const currentTimeStr = `${currentHours}:${currentMinutes}`
  const currentTotalMin = timeToMinutes(currentTimeStr)

  return reminders.filter((rem) => {
    // 1. Is scheduled for today?
    const days = rem.reminder_days || [0, 1, 2, 3, 4, 5, 6]
    if (!days.includes(currentDayIdx)) return false

    // 2. Is inside quiet hours?
    if (isWithinQuietHours(currentTimeStr, rem.quiet_hours_start, rem.quiet_hours_end)) {
      return false
    }

    // 3. Time comparison
    if (!rem.reminder_time) return false
    const remTotalMin = timeToMinutes(rem.reminder_time)

    // Check if current time is between remTime and remTime + 60 mins (due now / active window)
    // Or coming up in the next 15 minutes
    const diff = currentTotalMin - remTotalMin
    const isActiveWindow = diff >= 0 && diff <= 60
    const isUpcoming = diff < 0 && diff >= -15

    return isActiveWindow || isUpcoming
  })
}

/**
 * Browser push/local notification best-effort helper
 */
export async function triggerLocalNotificationIfPermitted(
  title: string,
  options: NotificationOptions = {}
) {
  if (!('Notification' in window)) return // unsupported

  if (Notification.permission === 'granted') {
    try {
      // Show local notification
      new Notification(title, {
        badge: '/icons/icon-192x192.png',
        icon: '/icons/icon-192x192.png',
        ...options
      })
    } catch (err) {
      // In mobile PWA context, native service worker notification is preferred
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        if (reg) {
          reg.showNotification(title, {
            badge: '/icons/icon-192x192.png',
            icon: '/icons/icon-192x192.png',
            ...options
          })
        }
      }
    }
  }
  
  /*
   * TODO: Server-side Push Notification scheduling enhancement:
   * To support push notifications when the browser tab is fully closed:
   * 1. Request service worker subscription: reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_KEY })
   * 2. Store the push subscription credentials in a new database table `push_subscriptions` linked to `user_id`.
   * 3. Run a cron job / background function that queries active `reminders` due at the current minute.
   * 4. Trigger Web-Push calls via Node.js web-push library / Supabase Edge Function to the stored push service endpoints.
   */
}
