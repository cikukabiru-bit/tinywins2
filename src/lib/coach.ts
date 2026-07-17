import { getLocalDateString, isScheduledDay } from './streaks';

export interface CoachSuggestion {
  message: string;
  actionLabel?: string;
  actionPath?: string;
}

// Helper to get local hour of a ISO string
function getLocalHour(isoStr?: string): number {
  if (!isoStr) return 12; // default to mid-day
  return new Date(isoStr).getHours();
}

// Generate a coach recommendation for a single habit
export function generateHabitSuggestion(
  habit: {
    id: string;
    name: string;
    tiny_goal: string;
    start_date: string;
    frequency: string;
    custom_days: number[];
    growth_mode: string;
  },
  logs: { log_date: string; status: string; created_at?: string }[],
  tone: string = 'Gentle',
  todayStr: string = getLocalDateString()
): CoachSuggestion {
  const completedLogs = logs.filter((l) => l.status === 'completed');
  const completedDates = new Set(completedLogs.map((l) => l.log_date));
  const isCompletedToday = completedDates.has(todayStr);

  // Compute stats
  const totalCompletions = completedLogs.length;

  // Calculate total scheduled days
  let totalScheduled = 0;
  const startDate = new Date(habit.start_date + 'T12:00:00');
  const today = new Date(todayStr + 'T12:00:00');
  let iterDate = new Date(startDate.getTime());
  while (iterDate <= today) {
    if (isScheduledDay(iterDate, habit.frequency, habit.custom_days)) {
      totalScheduled++;
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  const completionRate = totalScheduled > 0 ? totalCompletions / totalScheduled : 0;

  // Missed count
  let consecutiveMissed = 0;
  iterDate = new Date(today.getTime());
  iterDate.setDate(iterDate.getDate() - 1); // start yesterday
  while (iterDate >= startDate) {
    if (isScheduledDay(iterDate, habit.frequency, habit.custom_days)) {
      const dateStr = getLocalDateString(iterDate);
      if (completedDates.has(dateStr)) {
        break;
      } else {
        consecutiveMissed++;
      }
    }
    iterDate.setDate(iterDate.getDate() - 1);
  }

  // Calculate current streak
  let currentStreak = 0;
  let freezes = 3;
  let consecutiveCompleted = 0;
  iterDate = new Date(startDate.getTime());
  while (iterDate <= today) {
    const dateStr = getLocalDateString(iterDate);
    if (isScheduledDay(iterDate, habit.frequency, habit.custom_days)) {
      const isCompleted = completedDates.has(dateStr);
      const isToday = dateStr === todayStr;

      if (isCompleted) {
        consecutiveCompleted++;
        if (consecutiveCompleted === 7) {
          freezes = Math.min(3, freezes + 1);
          consecutiveCompleted = 0;
        }
        currentStreak++;
      } else {
        if (!isToday) {
          consecutiveCompleted = 0;
          if (freezes > 0) {
            freezes--;
            currentStreak++;
          } else {
            currentStreak = 0;
          }
        }
      }
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  // 1. Check if recently returned after a gap of >= 4 calendar days
  let isRecentReturn = false;
  if (isCompletedToday && completedLogs.length >= 2) {
    // Sort log dates descending
    const sortedDates = completedLogs
      .map((l) => l.log_date)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const daysGap = (new Date(sortedDates[0]).getTime() - new Date(sortedDates[1]).getTime()) / 86400000;
    if (daysGap >= 4) {
      isRecentReturn = true;
    }
  }

  // 2. Check for time of day clusters (needs >= 4 completions, and >= 70% in one group)
  let timeCluster: 'morning' | 'afternoon' | 'evening' | null = null;
  const logsWithTime = completedLogs.filter((l) => l.created_at);
  if (logsWithTime.length >= 4) {
    let morning = 0;
    let afternoon = 0;
    let evening = 0;
    logsWithTime.forEach((l) => {
      const hr = getLocalHour(l.created_at);
      if (hr >= 5 && hr < 12) morning++;
      else if (hr >= 12 && hr < 18) afternoon++;
      else evening++;
    });
    const totalWithTime = morning + afternoon + evening;
    if (morning / totalWithTime >= 0.7) timeCluster = 'morning';
    else if (afternoon / totalWithTime >= 0.7) timeCluster = 'afternoon';
    else if (evening / totalWithTime >= 0.7) timeCluster = 'evening';
  }

  // 3. Check completions in the last 7 days
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
  const completionsThisWeek = completedLogs.filter((l) => new Date(l.log_date) >= sevenDaysAgo).length;

  // Clean Tone names
  const cleanTone = tone.trim().toLowerCase();

  // Suggestion mappings
  if (isRecentReturn) {
    switch (cleanTone) {
      case 'motivational':
        return {
          message: "Welcome back! Taking that first step again is a massive win. Let's keep this momentum rolling!",
          actionLabel: "Keep going",
          actionPath: "/today"
        };
      case 'spiritual':
        return {
          message: "Your return is a quiet homecoming. Showing up today is a beautiful renewal of your path.",
          actionLabel: "Rest in today",
          actionPath: "/today"
        };
      case 'practical':
        return {
          message: "Good to see you checked in. Focus solely on completing today's win and let tomorrow take care of itself.",
          actionLabel: "View dashboard",
          actionPath: "/today"
        };
      case 'playful':
        return {
          message: "Yay, you're back! Let's do a quick happy dance. Showing up today is worth celebrating!",
          actionLabel: "Awesome",
          actionPath: "/today"
        };
      case 'firm but kind':
        return {
          message: "You have returned to your routine. Acknowledge this win, and commit to showing up again tomorrow.",
          actionLabel: "My habits",
          actionPath: "/habits"
        };
      case 'calm':
        return {
          message: "Welcome back to this quiet space. One simple win is everything. Let yourself rest in this completion.",
          actionLabel: "Pause here",
          actionPath: "/today"
        };
      case 'gentle':
      default:
        return {
          message: "It is so wonderful to see you back. One tiny moment of showing up today is more than enough.",
          actionLabel: "Take it easy",
          actionPath: "/today"
        };
    }
  }

  // Time cluster suggestion
  if (timeCluster) {
    const timeLabels = {
      morning: { name: 'morning', time: '8:00 AM' },
      afternoon: { name: 'afternoon', time: '2:00 PM' },
      evening: { name: 'evening', time: '8:00 PM' }
    };
    const target = timeLabels[timeCluster];

    switch (cleanTone) {
      case 'motivational':
        return {
          message: `You've got a power hour! You consistently show up in the ${target.name}. Let's lock it in for ${target.time} to make it stick!`,
          actionLabel: "Adjust time",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'spiritual':
        return {
          message: `The natural flow of your day calls you in the ${target.name}. Consider dedicating ${target.time} to this mindful practice.`,
          actionLabel: "Align time",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'practical':
        return {
          message: `Your check-ins cluster in the ${target.name}. Set your preferred time to ${target.time} to match your existing behavior.`,
          actionLabel: "Set time",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'playful':
        return {
          message: `You're a ${target.name} superstar! Shall we make it official and set the reminder for ${target.time}?`,
          actionLabel: "Lock it in",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'firm but kind':
        return {
          message: `Data shows your highest consistency is in the ${target.name}. Set the preferred time to ${target.time} to solidify this.`,
          actionLabel: "Fix time",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'calm':
        return {
          message: `A steady pattern emerges in the ${target.name}. Let your habit rest around ${target.time} in harmony with your day.`,
          actionLabel: "Set time",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'gentle':
      default:
        return {
          message: `You seem to show up naturally in the ${target.name}. Would it feel nice to officially set your time for ${target.time}?`,
          actionLabel: "Set time",
          actionPath: `/habits/${habit.id}/edit`
        };
    }
  }

  // Low consistency
  if (completionRate < 0.5 && totalScheduled >= 5) {
    switch (cleanTone) {
      case 'motivational':
        return {
          message: "When showing up feels tough, we adjust. Let's shrink this goal so it's simple to get a win today!",
          actionLabel: "Shrink habit",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'spiritual':
        return {
          message: "Honor your current energy. Consider shrinking this practice today to respect your heart's capacity.",
          actionLabel: "Make it smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'practical':
        return {
          message: "Your completion rate is low, indicating friction. Reduce the target to a 1-minute version to rebuild momentum.",
          actionLabel: "Reduce target",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'playful':
        return {
          message: "Time for a mini-mode check! Let's make this habit super tiny so it's a breeze to cross off today.",
          actionLabel: "Make smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'firm but kind':
        return {
          message: "The current target is too large for your routine. Shrink the habit goal immediately to build a stable streak.",
          actionLabel: "Adjust goal",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'calm':
        return {
          message: "Let go of the weight. A smaller step brings peaceful progress. Simplify your goal for now.",
          actionLabel: "Simplify",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'gentle':
      default:
        return {
          message: "If showing up feels heavy right now, that is completely okay. Let's make this goal smaller so it's easy to say yes.",
          actionLabel: "Make it smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
    }
  }

  // High consistency
  if (currentStreak >= 5 || (completionRate >= 0.8 && totalScheduled >= 5)) {
    const isGrowthAllowed = habit.growth_mode === 'Increase slowly' || habit.growth_mode === 'Let Tiny Coach suggest';
    if (isGrowthAllowed) {
      switch (cleanTone) {
        case 'motivational':
          return {
            message: `You are showing incredible consistency with "${habit.name}"! Ready to level up and expand this slightly next week?`,
            actionLabel: "Grow habit",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'spiritual':
          return {
            message: "Your practice has grown deep roots. If you feel called, consider expanding this mindful space slightly.",
            actionLabel: "Expand goal",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'practical':
          return {
            message: "High consistency established. Progress the habit by increasing the tiny goal target starting next week.",
            actionLabel: "Grow goal",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'playful':
          return {
            message: "You're a habit wizard! How about we level up the challenge just a tiny smidge next week?",
            actionLabel: "Level up",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'firm but kind':
          return {
            message: "You have proven your consistency. Now, challenge yourself. Expand your target slightly starting next week.",
            actionLabel: "Expand goal",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'calm':
          return {
            message: "The stream flows naturally. If you feel ready, welcome a slightly larger practice next week.",
            actionLabel: "Grow goal",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'gentle':
        default:
          return {
            message: `You've built such a steady rhythm with "${habit.name}". Would it feel good to gently expand the target next week?`,
            actionLabel: "Grow habit",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
      }
    } else {
      // Celebrating keeping it tiny
      switch (cleanTone) {
        case 'motivational':
          return {
            message: "Outstanding consistency! Keeping your habits small is the secret to building unstoppable momentum.",
            actionLabel: "View streaks",
            actionPath: "/today"
          };
        case 'spiritual':
          return {
            message: "Your presence here is a quiet blessing. Honouring this small practice holds deep, sacred space.",
            actionLabel: "Rest in win",
            actionPath: "/today"
          };
        case 'practical':
          return {
            message: "Great job showing up. Keeping the habit tiny ensures high consistency. Repeat this exact step tomorrow.",
            actionLabel: "Check today",
            actionPath: "/today"
          };
        case 'playful':
          return {
            message: "Look at you go! Keeping it tiny and fun is the way. High-fives all around for showing up today!",
            actionLabel: "Celebrate",
            actionPath: "/today"
          };
        case 'firm but kind':
          return {
            message: "Consistency is a strong foundation. You are doing the work. Stay with this size and protect your routine.",
            actionLabel: "Keep steady",
            actionPath: "/today"
          };
        case 'calm':
          return {
            message: "A quiet, steady path. Keeping it small invites peace. Rest in this simple consistency today.",
            actionLabel: "Rest here",
            actionPath: "/today"
          };
        case 'gentle':
        default:
          return {
            message: "You've been showing up so beautifully. Keeping this step tiny lets you protect this warm space.",
            actionLabel: "Celebrate win",
            actionPath: "/today"
          };
      }
    }
  }

  // Steady progress
  if (completionsThisWeek >= 2) {
    switch (cleanTone) {
      case 'motivational':
        return {
          message: `You showed up ${completionsThisWeek} times this week! That is ${completionsThisWeek} steps in the right direction. Let's go for one more!`,
          actionLabel: "Keep pushing",
          actionPath: "/today"
        };
      case 'spiritual':
        return {
          message: `You completed this ${completionsThisWeek} times this week. Honor this quiet dedication; it is a sacred thread of presence.`,
          actionLabel: "Contemplate",
          actionPath: "/today"
        };
      case 'practical':
        return {
          message: `You completed ${completionsThisWeek} sessions this week. This is a solid baseline. Continue at this pace to build automaticity.`,
          actionLabel: "Maintain pace",
          actionPath: "/today"
        };
      case 'playful':
        return {
          message: `Boom! ${completionsThisWeek} completions this week! You're making real progress. Keep up the awesome work!`,
          actionLabel: "Keep it up",
          actionPath: "/today"
        };
      case 'firm but kind':
        return {
          message: `You showed up ${completionsThisWeek} times this week. That is progress. Maintain this effort and build your momentum.`,
          actionLabel: "Show up",
          actionPath: "/today"
        };
      case 'calm':
        return {
          message: `You showed up ${completionsThisWeek} times this week. Let this quiet progress settle. You are doing well.`,
          actionLabel: "Rest well",
          actionPath: "/today"
        };
      case 'gentle':
      default:
        return {
          message: `You showed up ${completionsThisWeek} times this week. Each time was a beautiful gift of attention to yourself.`,
          actionLabel: "Appreciate progress",
          actionPath: "/today"
        };
    }
  }

  // Default general coaching suggestion
  switch (cleanTone) {
    case 'motivational':
      return {
        message: "Every tiny victory counts! Focus on showing up for your next scheduled habit and let the momentum build.",
        actionLabel: "Ready",
        actionPath: "/today"
      };
    case 'spiritual':
      return {
        message: "May you move with gentle intention today. Each small step is a quiet practice of alignment and care.",
        actionLabel: "Mindful check",
        actionPath: "/today"
      };
    case 'practical':
      return {
        message: "Consistency is established one session at a time. Review your dashboard and check in for today's habits.",
        actionLabel: "View dashboard",
        actionPath: "/today"
      };
    case 'playful':
      return {
        message: "One small step for you, one giant leap for habit-kind! What tiny win are we scoring today?",
        actionLabel: "Let's go",
        actionPath: "/today"
      };
    case 'firm but kind':
      return {
        message: "Your habits define your path. Review today's list, perform the tiny goal, and check it off.",
        actionLabel: "Review list",
        actionPath: "/today"
      };
    case 'calm':
      return {
        message: "No rush, no strain. Just one quiet choice to show up. Welcome this small practice today.",
        actionLabel: "Pause here",
        actionPath: "/today"
      };
    case 'gentle':
    default:
      return {
        message: "Every small step counts. Be gentle with your pace today, and remember that showing up is enough.",
        actionLabel: "Go to dashboard",
        actionPath: "/today"
      };
  }
}

// Generate a summary suggestion for the user overall (when viewing the main coach suggestions page)
export function generateGeneralSuggestion(
  habits: {
    id: string;
    name: string;
    tiny_goal: string;
    start_date: string;
    frequency: string;
    custom_days: number[];
    growth_mode: string;
    habit_logs: { log_date: string; status: string; created_at?: string }[];
  }[],
  tone: string = 'Gentle',
  todayStr: string = getLocalDateString()
): CoachSuggestion {
  if (habits.length === 0) {
    return {
      message: "Check in a few times and Tiny Coach will have gentle suggestions for you.",
      actionLabel: "Add your first habit",
      actionPath: "/habits/new"
    };
  }

  // Look for any habit with consecutive misses >= 3 first (needs the most care!)
  for (const habit of habits) {
    const stats = calculateStreakForGeneral(habit.start_date, habit.frequency, habit.custom_days, habit.habit_logs, todayStr);
    if (stats.consecutive_missed >= 3) {
      return generateHabitSuggestion(habit, habit.habit_logs, tone, todayStr);
    }
  }

  // Otherwise, look for a habit with low completion rate
  for (const habit of habits) {
    const stats = calculateStreakForGeneral(habit.start_date, habit.frequency, habit.custom_days, habit.habit_logs, todayStr);
    if (stats.completion_rate < 0.5 && stats.total_scheduled >= 5) {
      return generateHabitSuggestion(habit, habit.habit_logs, tone, todayStr);
    }
  }

  // Otherwise, default to the first active habit
  return generateHabitSuggestion(habits[0], habits[0].habit_logs, tone, todayStr);
}

// Helper to quickly calculate stats for general sorting
function calculateStreakForGeneral(
  startDateStr: string,
  frequency: string,
  customDays: number[],
  logs: { log_date: string; status: string }[],
  todayStr: string
) {
  const completedDates = new Set(logs.filter((l) => l.status === 'completed').map((l) => l.log_date));
  const startDate = new Date(startDateStr + 'T12:00:00');
  const today = new Date(todayStr + 'T12:00:00');

  let totalScheduled = 0;
  let iterDate = new Date(startDate.getTime());
  while (iterDate <= today) {
    if (isScheduledDay(iterDate, frequency, customDays)) {
      totalScheduled++;
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  let consecutiveMissed = 0;
  iterDate = new Date(today.getTime());
  iterDate.setDate(iterDate.getDate() - 1);
  while (iterDate >= startDate) {
    if (isScheduledDay(iterDate, frequency, customDays)) {
      if (completedDates.has(getLocalDateString(iterDate))) {
        break;
      } else {
        consecutiveMissed++;
      }
    }
    iterDate.setDate(iterDate.getDate() - 1);
  }

  return {
    completion_rate: totalScheduled > 0 ? completedDates.size / totalScheduled : 0,
    total_scheduled: totalScheduled,
    consecutive_missed: consecutiveMissed
  };
}
