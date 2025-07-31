const fs = require('fs');
const path = require('path');

// This script demonstrates how to prepare data for fine-tuning
// You would run this after collecting enough training examples

async function prepareFineTuneData() {
  // Example training data - in reality, this would come from your database
  const trainingData = [
    {
      messages: [
        {
          role: "user",
          content: "sport: basketball, location: Seattle, style: fantasy, appropriateness: clean, level: adult, extra: coffee"
        },
        {
          role: "assistant",
          content: "Seattle Slam Dunkers\nEmerald City Ballers\nCoffee Bean Bouncers\nPuget Sound Shooters\nRain City Rebels"
        }
      ]
    },
    {
      messages: [
        {
          role: "user", 
          content: "sport: football, location: Wisconsin, style: funny, appropriateness: dirty, level: adult, extra: cheese"
        },
        {
          role: "assistant",
          content: "Wisconsin Cheese Dick Punchers\nGreen Bay Ball Busters\nMilwaukee Nut Crushers\nMadison Sack Smashers\nBrew City Cock Blockers"
        }
      ]
    },
    {
      messages: [
        {
          role: "user",
          content: "sport: soccer, location: Portland, style: real, appropriateness: clean, level: youth, extra: trees"
        },
        {
          role: "assistant", 
          content: "Portland Timber Wolves\nForest City Strikers\nEvergreen Eagles\nCascade Kickers\nPinecone Panthers"
        }
      ]
    }
  ];

  // Write to JSONL format (required by OpenAI)
  const outputPath = path.join(__dirname, 'training-data.jsonl');
  const jsonlContent = trainingData.map(example => JSON.stringify(example)).join('\n');
  
  fs.writeFileSync(outputPath, jsonlContent);
  console.log(`Training data written to ${outputPath}`);
  console.log(`Total examples: ${trainingData.length}`);
  
  return outputPath;
}

async function startFineTuning(filePath) {
  // This would use OpenAI's fine-tuning API
  // You'd need to upload the file first, then start training
  
  console.log('To start fine-tuning:');
  console.log('1. Upload your training file:');
  console.log(`   curl -X POST https://api.openai.com/v1/files \\`);
  console.log(`     -H "Authorization: Bearer $OPENAI_API_KEY" \\`);
  console.log(`     -F "file=@${filePath}" \\`);
  console.log(`     -F "purpose=fine-tune"`);
  
  console.log('\n2. Start fine-tuning job:');
  console.log(`   curl -X POST https://api.openai.com/v1/fine_tuning/jobs \\`);
  console.log(`     -H "Authorization: Bearer $OPENAI_API_KEY" \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"training_file": "file-abc123", "model": "gpt-4o-mini"}'`);
}

// Run the setup
prepareFineTuneData().then(filePath => {
  startFineTuning(filePath);
}); 