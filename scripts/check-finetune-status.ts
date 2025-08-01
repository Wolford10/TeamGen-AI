// Using built-in fetch (available in Node 18+)

async function checkFineTuneStatus() {
  try {
    const jobId = 'ftjob-8qL7g5OzScccHUfuJWMfTv8t';
    
    const response = await fetch(`https://api.openai.com/v1/fine_tuning/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('🎯 Fine-tuning Job Status');
    console.log('========================');
    console.log(`Job ID: ${data.id}`);
    console.log(`Status: ${data.status}`);
    console.log(`Model: ${data.model}`);
    console.log(`Created: ${new Date(data.created_at * 1000).toLocaleString()}`);
    
    if (data.finished_at) {
      console.log(`Finished: ${new Date(data.finished_at * 1000).toLocaleString()}`);
    }
    
    if (data.fine_tuned_model) {
      console.log(`✅ Fine-tuned model: ${data.fine_tuned_model}`);
      console.log('\n🚀 Your model is ready! Update your API endpoint to use this model ID.');
    }
    
    if (data.error && Object.keys(data.error).length > 0) {
      console.log(`❌ Error: ${JSON.stringify(data.error)}`);
    }
    
    if (data.trained_tokens) {
      console.log(`Tokens trained: ${data.trained_tokens}`);
    }
    
    // Status explanations
    const statusExplanations = {
      'validating_files': '📋 Validating your training data format...',
      'queued': '⏳ Job queued, waiting to start training...',
      'running': '🏃‍♂️ Training in progress...',
      'succeeded': '✅ Training completed successfully!',
      'failed': '❌ Training failed - check error details',
      'cancelled': '🚫 Training was cancelled'
    };
    
    const explanation = statusExplanations[data.status as keyof typeof statusExplanations];
    if (explanation) {
      console.log(`\n${explanation}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
  }
}

// Run the script
if (require.main === module) {
  checkFineTuneStatus();
} 