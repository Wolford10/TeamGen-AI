import fs from 'fs';
import path from 'path';

async function setupFineTuning() {
  try {
    const dataPath = path.join(process.cwd(), 'fine-tune-data.jsonl');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Fine-tuning data file not found. Run "npm run convert-excel" first.');
      return;
    }

    console.log('🚀 Setting up fine-tuning process...\n');
    
    // Check file size
    const stats = fs.statSync(dataPath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    console.log(`📁 Data file size: ${fileSizeInMB.toFixed(2)} MB`);
    
    // Read and validate the data
    const data = fs.readFileSync(dataPath, 'utf-8');
    const lines = data.trim().split('\n');
    console.log(`📊 Training examples: ${lines.length}`);
    
    // Validate JSONL format
    let validExamples = 0;
    for (const line of lines) {
      try {
        const example = JSON.parse(line);
        if (example.messages && example.messages.length === 2) {
          validExamples++;
        }
      } catch (e) {
        console.error('❌ Invalid JSON in line:', line);
      }
    }
    
    console.log(`✅ Valid examples: ${validExamples}`);
    
    if (validExamples < 10) {
      console.error('❌ Need at least 10 valid examples for fine-tuning');
      return;
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Upload your data file to OpenAI:');
    console.log(`   curl -X POST https://api.openai.com/v1/files \\`);
    console.log(`     -H "Authorization: Bearer $OPENAI_API_KEY" \\`);
    console.log(`     -F "file=@${dataPath}" \\`);
    console.log(`     -F "purpose=fine-tune"`);
    
    console.log('\n2. Start fine-tuning job (replace FILE_ID with the ID from step 1):');
    console.log(`   curl -X POST https://api.openai.com/v1/fine_tuning/jobs \\`);
    console.log(`     -H "Authorization: Bearer $OPENAI_API_KEY" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"training_file": "FILE_ID", "model": "gpt-4o-mini"}'`);
    
    console.log('\n3. Monitor progress:');
    console.log(`   curl https://api.openai.com/v1/fine_tuning/jobs \\`);
    console.log(`     -H "Authorization: Bearer $OPENAI_API_KEY"`);
    
    console.log('\n4. Once complete, update your API endpoint with the new model ID');
    
    // Create a shell script for automation
    const shellScript = `#!/bin/bash

echo "🚀 Starting fine-tuning process..."

# Step 1: Upload file
echo "📤 Uploading training data..."
UPLOAD_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/files \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -F "file=@${dataPath}" \\
  -F "purpose=fine-tune")

FILE_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$FILE_ID" ]; then
  echo "❌ Failed to upload file"
  echo $UPLOAD_RESPONSE
  exit 1
fi

echo "✅ File uploaded with ID: $FILE_ID"

# Step 2: Start fine-tuning
echo "🎯 Starting fine-tuning job..."
FINE_TUNE_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/fine_tuning/jobs \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d "{\\"training_file\\": \\"$FILE_ID\\", \\"model\\": \\"gpt-4o-mini\\"}")

JOB_ID=$(echo $FINE_TUNE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to start fine-tuning"
  echo $FINE_TUNE_RESPONSE
  exit 1
fi

echo "✅ Fine-tuning job started with ID: $JOB_ID"
echo "📊 Monitor progress with: curl https://api.openai.com/v1/fine_tuning/jobs/$JOB_ID -H \\"Authorization: Bearer $OPENAI_API_KEY\\""
`;

    const scriptPath = path.join(process.cwd(), 'start-fine-tuning.sh');
    fs.writeFileSync(scriptPath, shellScript);
    fs.chmodSync(scriptPath, '755');
    
    console.log(`\n📜 Created automation script: ${scriptPath}`);
    console.log('   Run: ./start-fine-tuning.sh');
    
    console.log('\n💰 Estimated costs:');
    console.log('- Training: $50-200 (depending on model size)');
    console.log('- Usage: ~$0.0002 per request (vs $0.002 with current prompt)');
    console.log('- Break-even: After ~25,000 requests');
    
  } catch (error) {
    console.error('❌ Error setting up fine-tuning:', error);
  }
}

// Run the script
if (require.main === module) {
  setupFineTuning();
} 