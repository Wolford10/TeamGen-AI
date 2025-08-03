#!/usr/bin/env tsx

/**
 * Test script for team-based fantasy football API integration
 */

interface TestCase {
  name: string;
  input: {
    sport: string;
    style: string;
    location: string;
    cleanOrDirty: string;
    extra?: string;
    player?: string;
  };
  expectedTeam?: string;
}

const testCases: TestCase[] = [
  {
    name: "Bengals Team-Based Fantasy",
    input: {
      sport: "football",
      style: "fantasy",
      location: "bengals",
      cleanOrDirty: "clean"
    },
    expectedTeam: "Cincinnati Bengals"
  },
  {
    name: "Chiefs Team-Based Fantasy",
    input: {
      sport: "football",
      style: "fantasy",
      location: "chiefs",
      cleanOrDirty: "clean"
    },
    expectedTeam: "Kansas City Chiefs"
  },
  {
    name: "Eagles Team-Based Fantasy",
    input: {
      sport: "football",
      style: "fantasy",
      location: "eagles",
      cleanOrDirty: "clean"
    },
    expectedTeam: "Philadelphia Eagles"
  },
  {
    name: "Bengals with Extra Keywords",
    input: {
      sport: "football",
      style: "fantasy",
      location: "bengals",
      cleanOrDirty: "clean",
      extra: "dynasty, who dey"
    },
    expectedTeam: "Cincinnati Bengals"
  },
  {
    name: "Non-Team Location (Should use original logic)",
    input: {
      sport: "football",
      style: "fantasy",
      location: "Boston",
      cleanOrDirty: "clean"
    }
  },
  {
    name: "Non-Fantasy Style (Should use original logic)",
    input: {
      sport: "football",
      style: "real",
      location: "bengals",
      cleanOrDirty: "clean"
    }
  },
  {
    name: "Non-Football Sport (Should use original logic)",
    input: {
      sport: "basketball",
      style: "fantasy",
      location: "bengals",
      cleanOrDirty: "clean"
    }
  }
];

async function testTeamBasedAPI() {
  console.log('🧪 Testing Team-Based Fantasy Football API Integration\n');

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      const names = data.names || [];

      console.log(`✅ Generated ${names.length} names:`);
      names.forEach((name: string, index: number) => {
        console.log(`  ${index + 1}. ${name}`);
      });

      // Analyze the names for team relevance
      if (testCase.expectedTeam) {
        const teamName = testCase.expectedTeam.toLowerCase();
        const teamRelevantNames = names.filter((name: string) => 
          name.toLowerCase().includes(teamName.split(' ')[0]) || // First word of team name
          name.toLowerCase().includes(teamName.split(' ')[1]) || // Second word of team name
          name.toLowerCase().includes('burrow') || // Bengals specific
          name.toLowerCase().includes('chase') || // Bengals specific
          name.toLowerCase().includes('mahomes') || // Chiefs specific
          name.toLowerCase().includes('kelce') || // Chiefs specific
          name.toLowerCase().includes('hurts') || // Eagles specific
          name.toLowerCase().includes('brown') // Eagles specific
        );

        const teamRelevancePercentage = (teamRelevantNames.length / names.length) * 100;
        console.log(`📊 Team Relevance: ${teamRelevancePercentage.toFixed(1)}% (${teamRelevantNames.length}/${names.length})`);

        if (teamRelevancePercentage >= 40) {
          console.log("✅ Good team relevance!");
        } else {
          console.log("⚠️  Low team relevance - may need improvement");
        }
      }

      // Check for fantasy football terminology
      const fantasyKeywords = [
        'dynasty', 'redraft', 'keeper', 'auction', 'PPR', 'standard', 'superflex',
        'waiver', 'trade', 'deadline', 'draft', 'sleepers', 'busts', 'handcuffs',
        'injury', 'reserve', 'taco', 'bye', 'playoffs', 'commissioner', 'league'
      ];

      const fantasyRelevantNames = names.filter((name: string) => 
        fantasyKeywords.some(keyword => 
          name.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      const fantasyRelevancePercentage = (fantasyRelevantNames.length / names.length) * 100;
      console.log(`📊 Fantasy Football Relevance: ${fantasyRelevancePercentage.toFixed(1)}% (${fantasyRelevantNames.length}/${names.length})`);

    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }

    console.log("\n" + "=".repeat(60) + "\n");
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testTeamBasedAPI().catch(console.error);
}

export { testTeamBasedAPI, testCases }; 