import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const {
      sport,
      style,
      location,
      cleanOrDirty,
      extra,
      level,
      player, // optional – for fantasy-football puns
    } = await req.json()

    // -------------- Prompt Engineering Upgrade --------------
    const isDirty = cleanOrDirty === 'dirty'

    // Tone templates
    const toneBlock = isDirty
      ? `Tone: edgy, irreverent, adult humor allowed. Forbidden: hate speech, slurs, under-18 references.`
      : `Tone: playful, family-friendly, suitable for all ages.`

    // Optional player line
    const playerLine =
      player && sport?.toLowerCase() === 'football'
        ? `Target player for pun-based fantasy football names: ${player}.`
        : ''

    // Core user prompt with step-by-step instructions
    const prompt = `
Sport: ${sport}
Location / primary color: ${location}
Audience level: ${level || 'any'}
${playerLine}
Extra keywords / themes: ${extra || 'none'}

${toneBlock}

TASKS
1. Brainstorm 3–5 vivid themes, puns, or local references related to the sport and location (do NOT output them).
2. Using those ideas, craft EXACTLY 5 unique team names.
   • Max 3 words each
   • At least 2 names must feature alliteration or rhyme
   • Avoid tired clichés like Eagles, Tigers, Warriors, Lions
   • Names must sound plausible for a real team—no nonsense words
   • In dirty tone, keep it edgy but within the forbidden-content rules above
3. Output ONLY the 5 names, one per line, no numbering, no extra text.

If a player name is supplied, each team name MUST pun on that player's first or last name and must not duplicate classic examples (Hurts So Good, Sweet Child O' Mahomes, etc.).
`

    // Few-shot pun examples (only when relevant)
    const fewShotExamples =
      player && sport?.toLowerCase() === 'football'
        ? [
            {
              role: 'assistant',
              content: `Example output for player "Jalen Hurts":\nHurts So Good\nHurts Locker Heroes\nHurts, Don't It?\nHurts Condition\nHurts So Bad`,
            },
            {
              role: 'assistant',
              content: `Example output for player "Patrick Mahomes":\nSweet Child O' Mahomes\nMahomes Alone\nMahomies Forever\nMahomes Field Advantage\nMahomes Improvement`,
            },
            {
              role: 'assistant',
              content: `Example output for player "Aaron Rodgers":\nMr. Rodgers Neighborhood\nDiscount Double Checkers\nRodgers That\nRodgers Rate Renegades\nA-Rod Squad`,
            },
          ]
        : []

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.9,
        top_p: 0.95,
        messages: [
          {
            role: 'system',
            content:
              'You are a world-class brand-naming expert and comedy writer. Deliver only the final team names—no explanations, no numbering.',
          },
          ...fewShotExamples,
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('OpenAI API error:', res.status, errorData)
      return NextResponse.json(
        { error: `OpenAI API error: ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()

    const raw = data.choices?.[0]?.message?.content || ''
    const names = raw
      .split('\n')
      .map((n: string) => n.trim().replace(/^[-*\d.\s]+/, ''))
      .filter((n: string) => n.length > 0)
      .slice(0, 5)

    if (!names.length) {
      console.error('No team names generated from OpenAI')
      return NextResponse.json(
        { error: 'No team names generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({ names })
  } catch (error) {
    console.error('Error generating team names:', error)
    return NextResponse.json(
      { error: 'Failed to generate team names' },
      { status: 500 }
    )
  }
}
