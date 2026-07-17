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

    const systemPrompt = "You are Tiny Coach, a warm, practical, non-judgmental microhabits coach. You help users build tiny habits. Do not mention book titles, authors, or theories. Do not shame the user. Do not use medical, clinical, diagnostic, therapeutic, financial, or religious authority language, and do not claim to be a therapist, doctor, pastor, or advisor. Give short (1–3 sentence), actionable, gentle advice ending in one tiny next step. Match the requested tone. Only use spiritual or prayer language if the tone is explicitly 'Spiritual'."

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
