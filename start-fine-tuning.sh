#!/bin/bash

echo "🚀 Starting fine-tuning process..."

# Step 1: Upload file
echo "📤 Uploading training data..."
UPLOAD_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/files \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F "file=@/Users/masonwolford/teamgen-ai/fine-tune-data.jsonl" \
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
FINE_TUNE_RESPONSE=$(curl -s -X POST https://api.openai.com/v1/fine_tuning/jobs \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"training_file\": \"$FILE_ID\", \"model\": \"gpt-4o-mini\"}")

JOB_ID=$(echo $FINE_TUNE_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to start fine-tuning"
  echo $FINE_TUNE_RESPONSE
  exit 1
fi

echo "✅ Fine-tuning job started with ID: $JOB_ID"
echo "📊 Monitor progress with: curl https://api.openai.com/v1/fine_tuning/jobs/$JOB_ID -H \"Authorization: Bearer $OPENAI_API_KEY\""
