# Fine-tuning Guide for Team Name Generation AI

## What is Fine-tuning?

Fine-tuning is a process where you take a pre-trained AI model (like GPT-4) and train it further on your specific dataset to make it better at your particular task. Think of it like teaching a generalist expert to become a specialist in your domain.

## Why Fine-tune Your Team Name Generator?

### Current Approach (Prompt Engineering)
- **Pros**: Quick to implement, flexible, no training required
- **Cons**: 
  - Inconsistent results with complex inputs
  - High token usage (expensive)
  - Limited by context window
  - Requires extensive prompt engineering

### Fine-tuned Approach
- **Pros**:
  - More consistent and reliable output
  - Lower token usage (cheaper)
  - Better understanding of your specific domain
  - Simpler prompts needed
  - Can learn from user feedback
- **Cons**:
  - Requires training data collection
  - Initial setup time and cost
  - Less flexible for rapid changes

## How Fine-tuning Works

### 1. Data Collection Phase
Collect high-quality examples of:
- User inputs (sport, location, style, etc.)
- Generated team names
- User ratings/feedback

### 2. Data Preparation
Format your data in OpenAI's required JSONL format:
```json
{"messages": [{"role": "user", "content": "sport: basketball, location: Seattle, style: fantasy, appropriateness: clean, level: adult, extra: coffee"}, {"role": "assistant", "content": "Seattle Slam Dunkers\nEmerald City Ballers\nCoffee Bean Bouncers\nPuget Sound Shooters\nRain City Rebels"}]}
{"messages": [{"role": "user", "content": "sport: football, location: Wisconsin, style: funny, appropriateness: dirty, level: adult, extra: cheese"}, {"role": "assistant", "content": "Wisconsin Cheese Dick Punchers\nGreen Bay Ball Busters\nMilwaukee Nut Crushers\nMadison Sack Smashers\nBrew City Cock Blockers"}]}
```

### 3. Training Process
1. Upload training data to OpenAI
2. Start fine-tuning job
3. Monitor training progress
4. Deploy your custom model

## Implementation Steps

### Step 1: Collect Training Data
Use the `fine-tune-data-generator` API to collect user interactions:
```javascript
// After generating names, collect feedback
await fetch('/api/fine-tune-data-generator', {
  method: 'POST',
  body: JSON.stringify({
    userInput: { sport, location, style, cleanOrDirty, level, extra },
    generatedNames: names,
    userRating: rating // 1-5 stars
  })
});
```

### Step 2: Prepare Training Data
Run the setup script to format your data:
```bash
node scripts/fine-tune-setup.js
```

### Step 3: Start Fine-tuning
```bash
# Upload your training file
curl -X POST https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "file=@training-data.jsonl" \
  -F "purpose=fine-tune"

# Start fine-tuning job
curl -X POST https://api.openai.com/v1/fine_tuning/jobs \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"training_file": "file-abc123", "model": "gpt-4o-mini"}'
```

### Step 4: Use Your Fine-tuned Model
Replace your current API call with the fine-tuned version:
```javascript
// Before (complex prompt)
const prompt = `Generate 5 creative...` // 500+ tokens

// After (simple prompt)
const prompt = `sport: ${sport}, location: ${location}, style: ${style}, appropriateness: ${cleanOrDirty}, level: ${level}, extra: ${extra}` // ~50 tokens
```

## Data Requirements

### Minimum Dataset Size
- **Recommended**: 500-1000 high-quality examples
- **Minimum**: 100 examples
- **Optimal**: 2000+ examples for best results

### Data Quality Guidelines
1. **Diverse inputs**: Cover different sports, locations, styles
2. **High-quality outputs**: Only include names you'd actually use
3. **Consistent formatting**: Same input/output structure
4. **User feedback**: Include ratings to train on quality

### Example Training Data Structure
```json
{
  "sport": "basketball",
  "location": "Seattle", 
  "style": "fantasy",
  "cleanOrDirty": "clean",
  "level": "adult",
  "extra": "coffee",
  "generatedNames": ["Seattle Slam Dunkers", "Emerald City Ballers", ...],
  "userRating": 5,
  "userFeedback": "Perfect! Love the local references"
}
```

## Cost Comparison

### Current Approach
- **Prompt tokens**: ~500 per request
- **Cost per request**: ~$0.002 (GPT-4o-mini)
- **Total cost for 1000 requests**: ~$2.00

### Fine-tuned Approach
- **Training cost**: ~$50-200 (one-time)
- **Prompt tokens**: ~50 per request
- **Cost per request**: ~$0.0002
- **Total cost for 1000 requests**: ~$0.20
- **Break-even**: After ~25,000 requests

## Best Practices

### 1. Start Small
- Begin with 100-200 examples
- Test the model
- Iterate and improve

### 2. Quality Over Quantity
- Better to have 100 excellent examples than 1000 mediocre ones
- Curate your training data carefully

### 3. Monitor Performance
- Track user satisfaction
- Compare with baseline model
- A/B test different versions

### 4. Iterative Improvement
- Collect feedback on fine-tuned model
- Add new examples to training data
- Retrain periodically

## Next Steps

1. **Implement data collection** in your frontend
2. **Set up a database** to store training examples
3. **Create a feedback system** for users to rate generated names
4. **Start collecting data** while using your current prompt-based approach
5. **Once you have 500+ examples**, run your first fine-tuning job
6. **A/B test** the fine-tuned model against your current approach
7. **Iterate and improve** based on results

## Tools Created

- `app/api/fine-tune-data-generator/route.ts` - Collects training data
- `app/api/generate-fine-tuned/route.ts` - Uses fine-tuned model
- `scripts/fine-tune-setup.js` - Prepares training data
- This guide - Complete implementation roadmap

The fine-tuned approach will make your team name generator more consistent, cheaper to run, and better at understanding your specific requirements! 