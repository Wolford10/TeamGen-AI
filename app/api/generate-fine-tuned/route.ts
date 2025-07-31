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
      player,
    } = await req.json()

    // Much simpler prompt for fine-tuned model
    const simplePrompt = `sport: ${sport}, location: ${location}, style: ${style}, appropriateness: ${cleanOrDirty}, level: ${level || 'any'}, extra: ${extra}${player ? `, player: ${player}` : ''}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // Replace with your fine-tuned model ID
        model: 'ft:gpt-4o-mini:your-org:your-model-id:version',
        messages: [
          {
            role: 'user',
            content: simplePrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
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
      console.error('No team names generated from fine-tuned model')
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