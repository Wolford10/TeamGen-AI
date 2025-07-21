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

    const { teamName } = await req.json()

    const prompt = `
Generate a creative mascot and team description for the sports team: "${teamName}"

Please provide:
1. A mascot name and animal that fits the team name theme
2. A brief personality description for the mascot (2-3 words)
3. A short team description (1-2 sentences, max 150 characters) that includes the mascot and team style

Format your response as JSON:
{
  "mascotName": "Name of the mascot",
  "mascotAnimal": "Type of animal",
  "mascotPersonality": "Brief personality description",
  "description": "Team description with mascot included"
}

IMPORTANT: Keep the description short and punchy - maximum 150 characters. Make it fun, creative, and fitting for the team name!
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
            content: 'You are a creative sports mascot and team description generator. Always respond with valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
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

    try {
      // Strip out code block markers if present
      const cleanedRaw = raw.replace(/```json\s*/, '').replace(/\s*```/, '').trim()
      const result = JSON.parse(cleanedRaw)
      return NextResponse.json(result)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', raw)
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error generating mascot:', error)
    return NextResponse.json(
      { error: 'Failed to generate mascot and description' },
      { status: 500 }
    )
  }
} 