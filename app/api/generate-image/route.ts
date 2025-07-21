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

    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('Generating logo with prompt:', prompt)

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('OpenAI DALL-E API error:', res.status, errorData)
      return NextResponse.json(
        { error: `OpenAI DALL-E API error: ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()
    const imageUrl = data.data?.[0]?.url

    if (!imageUrl) {
      console.error('No image URL in OpenAI response')
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      )
    }

    console.log('Logo generated successfully:', imageUrl)
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error generating logo:', error)
    return NextResponse.json(
      { error: 'Failed to generate logo' },
      { status: 500 }
    )
  }
} 