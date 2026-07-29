import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Basic in-memory rate limiter per IP address
const ipRequestHistory = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window
  const maxRequests = 12 // max 12 requests per minute (one every 5 seconds average)

  if (!ipRequestHistory.has(ip)) {
    ipRequestHistory.set(ip, [now])
    return true
  }

  const timestamps = ipRequestHistory.get(ip)!.filter((t) => now - t < windowMs)
  if (timestamps.length >= maxRequests) {
    return false // Rate limit exceeded
  }

  timestamps.push(now)
  ipRequestHistory.set(ip, timestamps)
  return true
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for') || 'anonymous'

  // Spam Guard Check
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please take a gentle pause before asking again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { 
      category, 
      completion_pattern, 
      current_streak, 
      consecutive_missed, 
      coach_tone, 
      reflection_summary 
    } = await req.json()

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the prompt using minimal non-sensitive statistics
    let userPrompt = `Habit Category: ${category || 'General'}\n`
    userPrompt += `Recent completion pattern: ${completion_pattern || 'none'}\n`
    userPrompt += `Current streak: ${current_streak} days\n`
    userPrompt += `Consecutive missed days: ${consecutive_missed}\n`
    userPrompt += `Tone requested: ${coach_tone || 'Gentle'}\n`
    if (reflection_summary) {
      // Short, non-sensitive reflection summary consented by user
      userPrompt += `Recent user reflection note: "${reflection_summary}"\n`
    }
    userPrompt += `\nPlease write a personalized, encouraging response following your system instructions.`

    const systemPrompt = `You are Tiny Coach, a microhabits coach. Help the user build tiny habits. Give short (1-3 sentences), actionable advice ending in one tiny next step. Match the requested tone exactly:
- 'Gentle' / 'Calm': Soft, warm, nurturing. Absolutely no numbers-as-pressure (e.g., do not say "3 of 5", instead describe general progress softly, like "You did several workouts this week — lovely. Rest when you need to."). No pressure or scolding.
- 'Practical' / 'Neutral': Plain, factual, direct, no spin. Use numbers and direct stats (e.g., "3 of 4 sessions. 1 to go this week.").
- 'Motivational' / 'Firm but kind' / 'Firm-but-kind': Genuinely DIRECT, BRACING, and blunt. No coddling. Name the gap plainly and challenge the user to rise like a demanding coach who believes in them. Short sentences, high energy, a hard push.
  * If making progress: Clap LOUD (e.g., "Four for four. That's exactly who you're becoming. Keep it.").
  * If falling short: Challenge forward, hard but believing (e.g., "2 of 4. That's not your best and you know it. Five days left — go." or "Halfway. Don't coast now. Finish the week.").
- 'Spiritual': Use prayerful, reflective, or mindful language.
- 'Playful': Fun, high-fives, lighthearted.

CRITICAL CONSTRAINT (THE ONE HARD LINE):
While 'Motivational'/'Firm but kind' is blunt and challenging, it must always point FORWARD (you are capable of more, rise to the challenge) and NEVER DOWN (never suggest failure, worthlessness, or shame).
Absolutely forbidden in ALL tones: insults, name-calling, words like "pathetic", "weak", "lazy", "useless", shaming the user for being human, or suggesting they are less because they fell short. If a line would sting without motivating, do not write it.`


    // Call OpenAI Chat Completion
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(
        JSON.stringify({ error: `AI provider error: ${errText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resData = await response.json()
    let content = resData.choices?.[0]?.message?.content || ''
    content = content.trim().replace(/^["']|["']$/g, '') // remove quotes

    // Validate and trim to maximum 3 sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [content]
    if (sentences.length > 3) {
      content = sentences.slice(0, 3).join(' ')
    }

    return new Response(
      JSON.stringify({ suggestion: content }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
