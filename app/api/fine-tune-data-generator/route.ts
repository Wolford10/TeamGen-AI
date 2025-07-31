import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userInput, generatedNames, userRating } = await req.json()
    
    // This would typically save to a database
    // For now, we'll just return the formatted training example
    const trainingExample = {
      messages: [
        {
          role: "user",
          content: `sport: ${userInput.sport}, location: ${userInput.location}, style: ${userInput.style}, appropriateness: ${userInput.cleanOrDirty}, level: ${userInput.level}, extra: ${userInput.extra}`
        },
        {
          role: "assistant", 
          content: generatedNames.join('\n')
        }
      ]
    }

    // In a real implementation, you'd save this to a database
    // and periodically export all examples for fine-tuning
    
    return NextResponse.json({ 
      success: true, 
      trainingExample,
      message: "Training data collected successfully"
    })
  } catch (error) {
    console.error('Error collecting training data:', error)
    return NextResponse.json(
      { error: 'Failed to collect training data' },
      { status: 500 }
    )
  }
} 