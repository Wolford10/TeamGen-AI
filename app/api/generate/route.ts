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

    const cleanExamples = `
Here are examples of great family-friendly team names:

Animals:
Bobcats, Wolves, Tigers, Panthers, Bulldogs, Cheetahs, Cougars, Pumas
Hawks, Eagles, Falcons
Bears, Lions, Raptors

Strong and powerful:
Avengers, Hot Shots, Outlaws, Rebels, Gladiators, Marauders, Mavericks, Titans
Inferno, Fireballs, Hurricanes

Teamwork and Determination:
Dream Team, A-Team, Challengers, Achievers, Royals, Warriors
Apex, Aces, Strikers

Fun and Unique:
Ninjas, Superheroes, Divas, Knights, Rockets, Wildcats

These names are: memorable, fun, powerful, and suitable for all ages.`

    const dirtyExamples = `
Here are examples of hilarious R-rated team names:
- The Ball Busters
- The Dick Punchers
- The Ass Kickers
- The Nut Crushers
- The Sack Smashers
- The Cock Blockers
- The Pussy Pounders
- The Dick Destroyers
- The Ass Assassins
- The Ball Bangers

These names are: wildly inappropriate, adult-themed, and extremely funny.`

    const promptIntro = isDirty
      ? `Generate 5 hilarious, edgy, and R-rated sports team names for a ${sport} team. These names must be wildly inappropriate, adult-themed, and extremely funny. In dirty mode, edgy adult humor is allowed, but disallowed content includes explicit slurs, racial slurs, hate speech, under-18 references, or illegal content.`
      : `Generate 5 creative and family-appropriate sports team names for a ${sport} team. Keep them fun, original, and suitable for all ages.`

    const examples = isDirty ? dirtyExamples : cleanExamples

    const fewShotExample = `
Example Input: sport: "basketball", location: "Seattle", style: "clean", level: "adult", extra: "coffee"
Example Output:
Seattle Slam Dunkers
Emerald City Ballers
Coffee Bean Bouncers
Puget Sound Shooters
Rain City Rebels

Notice: Alliteration, local references (Emerald City, Puget Sound, Rain City), sport-specific terms, and theme integration.`

    // Build full prompt
    const prompt = `
${promptIntro}

${examples}

${fewShotExample}

Details:
- Sport: ${sport}
- Style (clean or dirty): ${cleanOrDirty}
- Location or color: ${location}
- Level: ${level || 'any'}
- Extra keywords or themes: ${extra}

Requirements:
- Each name must be on its own line
- No numbers, no bullets, no quotes
- Do NOT explain anything
- Only return the team names
- Follow the style and quality of the examples above
- Incorporate the user's answers to all prompt questions (sport, style, location or color, level, extra keywords) into each team name as appropriate. For example, if the sport is 'basketball', style is 'funny', location is 'Wisconsin', level is 'youth', and extra is 'cheese', a name could be 'Wisconsin Cheese Ballers'.
- If a location or color is provided, prepend it to each team name. For example, if the location is 'Wisconsin' and the name is 'Warriors', output 'Wisconsin Warriors'.
- Max 3 words per name
- At least 2 names must use alliteration or rhyme
- Avoid clichés like Eagles, Tigers, Warriors, Lions (unless combined with location/theme)
- Each name must be unique within the list
- Use clever wordplay, local references, and cultural nuance when possible
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
              'You are a world-class brand-naming expert and comedy writer. Your mission: invent original, memorable sports-team names that perfectly match a given sport, location, and tone (family-friendly or R-rated). Avoid clichés; strive for clever wordplay, local references, and cultural nuance. Never use racial slurs, hate speech, or offensive content. Only return names — no intro, no explanation, no formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        top_p: 0.95,
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
