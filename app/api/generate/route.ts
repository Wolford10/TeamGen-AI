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
      location,
      cleanOrDirty,
      extra,
      level,
    } = await req.json()

    // Base prompt intro depending on clean/dirty
    const isDirty = cleanOrDirty === 'dirty'

    const promptIntro = isDirty
      ? `Generate 5 hilarious, edgy, and R-rated sports team names for a ${sport} team. These names must be wildly inappropriate, adult-themed, and extremely funny.`
      : `Generate 5 creative and family-appropriate sports team names for a ${sport} team. Keep them fun, original, and suitable for all ages.`

    // Build full prompt
    const prompt = `
${promptIntro}

Details:
- Location or color: ${location}
- Level: ${level || 'any'}
- Extra keywords or themes: ${extra}

Requirements:
- Each name must be on its own line
- No numbers, no bullets, no quotes
- Do NOT explain anything
- Only return the team names
`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a naming assistant. Only return names — no intro, no explanation, no formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
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
