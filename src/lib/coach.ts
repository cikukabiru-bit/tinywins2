import { getLocalDateString, isScheduledDay, calculateStreaks } from './streaks';

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
  const cleanTone = tone.trim().toLowerCase();

  // Analyze statuses for Part 1 check-in states
  const totalLogs = logs.length;
  const completedLogsCount = logs.filter(l => l.status === 'completed').length;
  const partialLogsCount = logs.filter(l => l.status === 'partial').length;
  const notDoneLogsCount = logs.filter(l => l.status === 'not_done').length;

  let statusAnalysis: 'completed' | 'partial' | 'not_done' | 'mix' | null = null;
  if (totalLogs >= 3) {
    if (completedLogsCount / totalLogs >= 0.6) {
      statusAnalysis = 'completed';
    } else if (partialLogsCount / totalLogs >= 0.4) {
      statusAnalysis = 'partial';
    } else if (notDoneLogsCount / totalLogs >= 0.4) {
      statusAnalysis = 'not_done';
    } else {
      statusAnalysis = 'mix';
    }
  }

  if (statusAnalysis === 'partial') {
    switch (cleanTone) {
      case 'motivational':
      case 'firm but kind':
        return {
          message: "Partial completions won't build the streak you want. Simplify the target and crush it 100%.",
          actionLabel: "Make smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'spiritual':
        return {
          message: "Showing up partly is a sacred step. If it feels heavy, consider making this practice smaller to honor your capacity.",
          actionLabel: "Make it smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'practical':
        return {
          message: "Partial completions indicate friction. Reduce target size to minimize execution friction.",
          actionLabel: "Reduce target",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'playful':
        return {
          message: "Woohoo, partly is still a win! Let's shrink it down a bit to make crossing it off super easy-peasy!",
          actionLabel: "Make smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'calm':
      case 'gentle':
      default:
        return {
          message: "A partial step is still progress. Be gentle with your pace and simplify the goal whenever you're ready.",
          actionLabel: "Simplify",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
    }
  }

  if (statusAnalysis === 'not_done') {
    switch (cleanTone) {
      case 'motivational':
      case 'firm but kind':
        return {
          message: "Zero completions. That's a gap. Modify the day or time now, and show up tomorrow. You are capable of more.",
          actionLabel: "Adjust habit",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'spiritual':
        return {
          message: "Honesty is its own form of presence. No guilt. Let's gently adjust this practice's time, days, or size to match your path.",
          actionLabel: "Adjust path",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'practical':
        return {
          message: "No completions logged. The habit is currently too large or incorrectly scheduled. Modify days, time, or size.",
          actionLabel: "Modify habit",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'playful':
        return {
          message: "High-five for keeping it real! No worries at all. Want to tweak the size, days, or time to make it play better with your schedule?",
          actionLabel: "Tweak habit",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'calm':
      case 'gentle':
      default:
        return {
          message: "A quiet space is an honest one. Rest without guilt. You can adjust the time, days, or size whenever you are ready.",
          actionLabel: "Adjust setting",
          actionPath: `/habits/${habit.id}/edit`
        };
    }
  }

  if (statusAnalysis === 'mix') {
    switch (cleanTone) {
      case 'motivational':
      case 'firm but kind':
        return {
          message: "You are maintaining the routine by logging, but you can turn these tries into clean wins. Stay focused.",
          actionLabel: "Keep going",
          actionPath: "/today"
        };
      case 'spiritual':
        return {
          message: "Every checked-in day is a thread in your tapestry. Praise the simple act of showing up at all.",
          actionLabel: "Mindful rest",
          actionPath: "/today"
        };
      case 'practical':
        return {
          message: "Variable completion pattern. Focus on performing the trigger. Keep checking in.",
          actionLabel: "View dashboard",
          actionPath: "/today"
        };
      case 'playful':
        return {
          message: "Check-ins of all shapes and sizes! You're keeping the habit alive by showing up. Keep rocking!",
          actionLabel: "Keep it up",
          actionPath: "/today"
        };
      case 'calm':
      case 'gentle':
      default:
        return {
          message: "You are showing up in different ways, and every bit counts. Be gentle with your pace.",
          actionLabel: "View habits",
          actionPath: "/today"
        };
    }
  }

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

  // Suggestion mappings
  if (isRecentReturn) {
    switch (cleanTone) {
      case 'motivational':
      case 'firm but kind':
        return {
          message: "You're back. Good. Now make it stick. Let's build a real streak starting today.",
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
          message: "Check-in logged. Gap completed. Resume standard routine.",
          actionLabel: "View dashboard",
          actionPath: "/today"
        };
      case 'playful':
        return {
          message: "Yay, you're back! Let's do a quick happy dance. Showing up today is worth celebrating!",
          actionLabel: "Awesome",
          actionPath: "/today"
        };
      case 'calm':
      case 'gentle':
      default:
        return {
          message: "Welcome back. Showing up today is more than enough. Rest when you need to.",
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
      case 'firm but kind':
        return {
          message: `${target.name.charAt(0).toUpperCase() + target.name.slice(1)} is your power hour. You've proved it. Lock it in for ${target.time} and make it non-negotiable.`,
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
          message: `Check-ins cluster in the ${target.name}. Setting reminder to ${target.time} aligns with your active window.`,
          actionLabel: "Set time",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'playful':
        return {
          message: `You're a ${target.name} superstar! Shall we make it official and set the reminder for ${target.time}?`,
          actionLabel: "Lock it in",
          actionPath: `/habits/${habit.id}/edit`
        };
      case 'calm':
      case 'gentle':
      default:
        return {
          message: `You seem to show up naturally in the ${target.name}. Setting your time to ${target.time} might help you keep this comfortable flow.`,
          actionLabel: "Set time",
          actionPath: `/habits/${habit.id}/edit`
        };
    }
  }

  // Low consistency
  if (completionRate < 0.5 && totalScheduled >= 5) {
    switch (cleanTone) {
      case 'motivational':
      case 'firm but kind':
        return {
          message: "Consistency is slipping and you know it. Shrink the goal today. No excuses, just get the win.",
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
          message: "Completion rate under 50%. Adjust the target size down to rebuild consistency.",
          actionLabel: "Reduce target",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'playful':
        return {
          message: "Time for a mini-mode check! Let's make this habit super tiny so it's a breeze to cross off today.",
          actionLabel: "Make smaller",
          actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
        };
      case 'calm':
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
        case 'firm but kind':
          return {
            message: `Unstoppable streak. You've earned the right to level up. Grow this habit next week.`,
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
            message: "High consistency established. Recommended to increase target starting next week.",
            actionLabel: "Grow goal",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'playful':
          return {
            message: "You're a habit wizard! How about we level up the challenge just a tiny smidge next week?",
            actionLabel: "Level up",
            actionPath: `/habits/${habit.id}/edit?focus=tiny_goal`
          };
        case 'calm':
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
        case 'firm but kind':
          return {
            message: "Streak protected. Solid consistency. Never underestimate the power of keeping it tiny.",
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
            message: "Routine stable. Target kept small for consistency. Continue current execution schedule.",
            actionLabel: "Check today",
            actionPath: "/today"
          };
        case 'playful':
          return {
            message: "Look at you go! Keeping it tiny and fun is the way. High-fives all around for showing up today!",
            actionLabel: "Celebrate",
            actionPath: "/today"
          };
        case 'calm':
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
    let scheduledThisWeek = 0;
    let weekIter = new Date(sevenDaysAgo.getTime());
    while (weekIter <= today) {
      if (isScheduledDay(weekIter, habit.frequency, habit.custom_days)) {
        scheduledThisWeek++;
      }
      weekIter.setDate(weekIter.getDate() + 1);
    }
    if (scheduledThisWeek === 0) scheduledThisWeek = 1;

    switch (cleanTone) {
      case 'motivational':
      case 'firm but kind':
        if (completionsThisWeek === scheduledThisWeek) {
          return {
            message: `${completionsThisWeek} for ${scheduledThisWeek}. That's exactly who you're becoming. Keep it.`,
            actionLabel: "Keep pushing",
            actionPath: "/today"
          };
        } else if (completionsThisWeek === Math.round(scheduledThisWeek / 2)) {
          return {
            message: "Halfway. Don't coast now. Finish the week.",
            actionLabel: "Keep pushing",
            actionPath: "/today"
          };
        } else {
          return {
            message: `${completionsThisWeek} of ${scheduledThisWeek}. That's not your best and you know it. Go.`,
            actionLabel: "Keep pushing",
            actionPath: "/today"
          };
        }
      case 'spiritual':
        return {
          message: `You completed this ${completionsThisWeek} times this week. Honor this quiet dedication; it is a sacred thread of presence.`,
          actionLabel: "Contemplate",
          actionPath: "/today"
        };
      case 'practical':
        return {
          message: `${completionsThisWeek} of ${scheduledThisWeek} sessions. ${scheduledThisWeek - completionsThisWeek > 0 ? (scheduledThisWeek - completionsThisWeek) + ' to go this week.' : 'Target achieved.'}`,
          actionLabel: "Maintain pace",
          actionPath: "/today"
        };
      case 'playful':
        return {
          message: `Boom! ${completionsThisWeek} completions this week! You're making real progress. Keep up the awesome work!`,
          actionLabel: "Keep it up",
          actionPath: "/today"
        };
      case 'calm':
      case 'gentle':
      default:
        return {
          message: "Wins this week — lovely. Rest when you need to.",
          actionLabel: "Appreciate progress",
          actionPath: "/today"
        };
    }
  }

  // Default general coaching suggestion
  switch (cleanTone) {
    case 'motivational':
    case 'firm but kind':
      return {
        message: "Your habits define your path. Do the work today. Go.",
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
        message: "0 of 1 habits checked in today. View checklist to complete action items.",
        actionLabel: "View checklist",
        actionPath: "/today"
      };
    case 'playful':
      return {
        message: "One small step for you, one giant leap for habit-kind! What tiny win are we scoring today?",
        actionLabel: "Let's go",
        actionPath: "/today"
      };
    case 'calm':
    case 'gentle':
    default:
      return {
        message: "No pressure, no strain. Just one quiet choice to show up. Welcome this small practice today.",
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

// Optional AI enhancement layer with 5s timeout fallback
export async function getSuggestionWithFallback(
  habit: any, // or null for overall
  allHabits: any[],
  logs: any[],
  tone: string,
  todayStr: string,
  supabaseClient: any,
  aiConsent: boolean
): Promise<CoachSuggestion> {
  const localSuggestion = habit
    ? generateHabitSuggestion(habit, logs, tone, todayStr)
    : generateGeneralSuggestion(allHabits, tone, todayStr);

  if (!aiConsent) {
    return localSuggestion;
  }

  try {
    const category = habit ? habit.category : 'Overall';
    
    let completionPattern = 'none';
    if (habit) {
      const completedLogs = logs.filter(l => l.status === 'completed');
      completionPattern = `completed ${completedLogs.length} times total`;
    } else {
      completionPattern = `overall habits count: ${allHabits.length}`;
    }

    let stats = { current_streak: 0, consecutive_missed: 0 };
    if (habit) {
      stats = calculateStreaks(habit.start_date, habit.frequency, habit.custom_days, logs, todayStr);
    }

    // Reflection Note summary: get the most recent log with a reflection note
    let reflectionSummary = '';
    const logsWithReflection = logs.filter(l => l.reflection && l.reflection.trim());
    if (logsWithReflection.length > 0) {
      const sortedLogs = [...logsWithReflection].sort((a, b) => new Date(b.log_date).getTime() - new Date(a).getTime());
      reflectionSummary = sortedLogs[0].reflection;
    }

    const completedLogsCount = logs.filter(l => l.status === 'completed').length;
    const partialLogsCount = logs.filter(l => l.status === 'partial').length;
    const notDoneLogsCount = logs.filter(l => l.status === 'not_done').length;

    const payload = {
      category,
      completion_pattern: completionPattern,
      current_streak: stats.current_streak,
      consecutive_missed: stats.consecutive_missed,
      coach_tone: tone,
      reflection_summary: reflectionSummary || undefined,
      logs_summary: {
        total: logs.length,
        completed: completedLogsCount,
        partial: partialLogsCount,
        not_done: notDoneLogsCount
      }
    };

    // Call Supabase Edge Function with a timeout
    const fetchPromise = supabaseClient.functions.invoke('tiny-coach', {
      body: payload
    });

    // 5 second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );

    const response: any = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (response.error) {
      throw new Error(response.error.message || 'Edge Function error');
    }

    if (response.data && response.data.suggestion) {
      return {
        message: response.data.suggestion,
        actionLabel: localSuggestion.actionLabel,
        actionPath: localSuggestion.actionPath
      };
    }

    return localSuggestion;
  } catch (err) {
    console.warn('Tiny Coach AI failed or timed out. Falling back to local mock suggestions.', err);
    return localSuggestion;
  }
}
