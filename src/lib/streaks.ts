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

// Calculate the current streak working backwards from today
export function calculateCurrentStreak(
  startDateStr: string,
  frequency: string,
  customDays: number[],
  completedDates: Set<string>,
  todayStr: string
): number {
  let streak = 0;
  // Initialize to local mid-day to prevent daylight savings/timezone boundary bugs
  let currentDate = new Date(todayStr + 'T12:00:00');
  const startDate = new Date(startDateStr + 'T12:00:00');

  // If today is a scheduled day and it has not been logged as completed yet,
  // we count the streak starting from yesterday to allow the user today to complete it.
  const todayIsScheduled = isScheduledDay(currentDate, frequency, customDays);
  const todayIsCompleted = completedDates.has(todayStr);

  if (todayIsScheduled && !todayIsCompleted) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Iterate backwards day by day
  while (currentDate >= startDate) {
    const dateStr = getLocalDateString(currentDate);
    const isScheduled = isScheduledDay(currentDate, frequency, customDays);

    if (isScheduled) {
      if (completedDates.has(dateStr)) {
        streak++;
      } else {
        // A missed scheduled day breaks the streak (soft reset)
        break;
      }
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// Calculate all stats: current streak, longest streak, completions, and completion rate
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

  let maxStreak = 0;
  let tempStreak = 0;

  // Forward loop to calculate longest streak
  let iterDate = new Date(startDate.getTime());
  while (iterDate <= today) {
    const dateStr = getLocalDateString(iterDate);
    const isScheduled = isScheduledDay(iterDate, frequency, customDays);

    if (isScheduled) {
      const isCompleted = completedDates.has(dateStr);
      const isToday = dateStr === todayStr;

      if (isCompleted) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        // Today doesn't break the longest streak calculation if it's not completed *yet*
        if (!isToday) {
          tempStreak = 0;
        }
      }
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(startDateStr, frequency, customDays, completedDates, todayStr);
  maxStreak = Math.max(maxStreak, currentStreak);

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

  return {
    current_streak: currentStreak,
    longest_streak: maxStreak,
    total_completions: totalCompletions,
    completion_rate: completionRate
  };
}
