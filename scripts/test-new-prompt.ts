// Using built-in fetch (available in Node 18+)

interface TestCase {
  name: string;
  input: {
    sport: string;
    location: string;
    style: string;
    cleanOrDirty: string;
    extra: string;
    level: string;
    player?: string;
  };
}

const testCases: TestCase[] = [
  {
    name: "Real Basketball Team - Seattle",
    input: {
      sport: "basketball",
      location: "Seattle",
      style: "real",
      cleanOrDirty: "clean",
      extra: "coffee",
      level: "adult"
    }
  },
  {
    name: "Fantasy Football with Player - Tom Brady",
    input: {
      sport: "football",
      location: "Boston",
      style: "fantasy",
      cleanOrDirty: "clean",
      extra: "clutch",
      level: "adult",
      player: "Tom Brady"
    }
  },
  {
    name: "Dirty Hockey Team - Denver",
    input: {
      sport: "hockey",
      location: "Denver",
      style: "real",
      cleanOrDirty: "dirty",
      extra: "blitz",
      level: "adult"
    }
  },
  {
    name: "Clean Baseball Team - Chicago",
    input: {
      sport: "baseball",
      location: "Chicago",
      style: "real",
      cleanOrDirty: "clean",
      extra: "wind",
      level: "adult"
    }
  },
  {
    name: "Fantasy Soccer - No Location",
    input: {
      sport: "soccer",
      location: "none",
      style: "fantasy",
      cleanOrDirty: "clean",
      extra: "steel",
      level: "adult"
    }
  }
];

async function testPrompt() {
  console.log("🧪 Testing New Prompt Engineering\n");
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log(`Input: ${JSON.stringify(testCase.input, null, 2)}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.input),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("Generated Names:");
      data.names.forEach((name: string, index: number) => {
        console.log(`  ${index + 1}. ${name}`);
      });
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
    
    console.log("\n" + "─".repeat(50));
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n✅ Testing complete!");
}

// Run the test
if (require.main === module) {
  testPrompt();
} 