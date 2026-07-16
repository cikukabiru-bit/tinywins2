// Helper function to check if a date is scheduled according to habit frequency and custom days
export function isScheduledDay(date: Date, frequency: string, customDays: number[] = []): boolean {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const days = customDays || [];
  
  if (frequency === 'daily') return true;
  if (frequency === 'weekdays') return day >= 1 && day <= 5;
  if (frequency === 'weekends') return day === 0 || day === 6;
  if (frequency === 'custom') return days.includes(day);
  
  return true;
}

// Convert a Date object to local YYYY-MM-DD string format
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate the consecutive missed scheduled days up to today (not including today)
export function calculateConsecutiveMissedScheduled(
  startDateStr: string,
  frequency: string,
  customDays: number[],
  completedDates: Set<string>,
  todayStr: string
): number {
  let missedCount = 0;
  // Initialize to local mid-day to prevent daylight savings shifts
  let currentDate = new Date(todayStr + 'T12:00:00');
  const startDate = new Date(startDateStr + 'T12:00:00');

  // We start checking from yesterday, because today is not a miss yet
  currentDate.setDate(currentDate.getDate() - 1);

  while (currentDate >= startDate) {
    const dateStr = getLocalDateString(currentDate);
    const isScheduled = isScheduledDay(currentDate, frequency, customDays);

    if (isScheduled) {
      if (completedDates.has(dateStr)) {
        // Broken by a completion!
        break;
      } else {
        missedCount++;
      }
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return missedCount;
}

// Calculate all stats: current streak (protected by freezes), longest streak, completions, remaining freezes, and missed count
export function calculateStreaks(
  startDateStr: string,
  frequency: string,
  customDays: number[],
  logs: { log_date: string; status: string }[],
  todayStr: string = getLocalDateString()
) {
  const completedDates = new Set(
    logs
      .filter((l) => l.status === 'completed')
      .map((l) => l.log_date)
  );

  const startDate = new Date(startDateStr + 'T12:00:00');
  const today = new Date(todayStr + 'T12:00:00');

  let freezes = 3;
  let consecutiveCompleted = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  let freezeUsedDates: string[] = [];

  // Walk day by day from startDate to today
  let iterDate = new Date(startDate.getTime());
  while (iterDate <= today) {
    const dateStr = getLocalDateString(iterDate);
    const isScheduled = isScheduledDay(iterDate, frequency, customDays);

    if (isScheduled) {
      const isCompleted = completedDates.has(dateStr);
      const isToday = dateStr === todayStr;

      if (isCompleted) {
        consecutiveCompleted++;
        if (consecutiveCompleted === 7) {
          freezes = Math.min(3, freezes + 1);
          consecutiveCompleted = 0;
        }
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        if (isToday) {
          // Today is not completed yet, but it's not a miss yet.
          // We do nothing (streak does not increase, consecutive does not increase,
          // but it doesn't break or consume a freeze).
        } else {
          // Past scheduled day missed!
          consecutiveCompleted = 0; // consecutive breaks
          if (freezes > 0) {
            freezes--;
            freezeUsedDates.push(dateStr);
            currentStreak++; // Streak is protected!
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0; // Soft reset!
          }
        }
      }
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  // Total completed logs count
  const totalCompletions = completedDates.size;

  // Calculate completion rate (completed scheduled days / total scheduled days since start_date)
  let totalScheduled = 0;
  iterDate = new Date(startDate.getTime());
  while (iterDate <= today) {
    if (isScheduledDay(iterDate, frequency, customDays)) {
      totalScheduled++;
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  const completionRate = totalScheduled > 0 ? totalCompletions / totalScheduled : 0;
  const consecutiveMissedCount = calculateConsecutiveMissedScheduled(
    startDateStr,
    frequency,
    customDays,
    completedDates,
    todayStr
  );

  return {
    current_streak: currentStreak,
    longest_streak: maxStreak,
    total_completions: totalCompletions,
    completion_rate: completionRate,
    remaining_freezes: freezes,
    freeze_used_dates: freezeUsedDates,
    consecutive_missed: consecutiveMissedCount
  };
}
