#!/usr/bin/env tsx

import { 
  recognizeTeam, 
  getTeamData, 
  getTeamByLocation, 
  getFantasyPlayers,
  generateTeamPromptContext,
  getTeamExamplePuns,
  isNFLTeam,
  getAvailableTeams
} from '../utils/team-recognition';

/**
 * Test team recognition functionality
 */
function testTeamRecognition() {
  console.log('🧪 Testing Team Recognition System\n');

  // Test 1: Team Recognition
  console.log('📋 Test 1: Team Recognition');
  const testLocations = [
    'bengals',
    'Bengals',
    'Cincinnati',
    'cincy',
    'chiefs',
    'Kansas City',
    'KC',
    'eagles',
    'Philadelphia',
    'Philly',
    'cowboys',
    'Dallas',
    'bills',
    'Buffalo',
    '49ers',
    'San Francisco',
    'SF',
    'niners',
    'ravens',
    'Baltimore',
    'BAL',
    'dolphins',
    'Miami',
    'lions',
    'Detroit',
    'packers',
    'Green Bay',
    'GB'
  ];

  testLocations.forEach(location => {
    const teamKey = recognizeTeam(location);
    const team = teamKey ? getTeamData(teamKey) : null;
    console.log(`${location.padEnd(15)} → ${teamKey?.padEnd(10)} → ${team?.name || 'Not found'}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Team Data Retrieval
  console.log('📋 Test 2: Team Data Retrieval');
  const testTeams = ['bengals', 'chiefs', 'eagles'];
  
  testTeams.forEach(teamKey => {
    const team = getTeamData(teamKey);
    if (team) {
      console.log(`\n${team.name}:`);
      console.log(`  City: ${team.city}`);
      console.log(`  Nickname: ${team.nickname}`);
      console.log(`  Stadium: ${team.stadium}`);
      console.log(`  Players: ${team.players.length}`);
      team.players.forEach(player => {
        console.log(`    - ${player.name} (${player.position}, ${player.fantasy_value})`);
      });
    }
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Fantasy Players Filtering
  console.log('📋 Test 3: Fantasy Players Filtering');
  testTeams.forEach(teamKey => {
    const fantasyPlayers = getFantasyPlayers(teamKey);
    const team = getTeamData(teamKey);
    console.log(`\n${team?.name} Fantasy Players:`);
    fantasyPlayers.forEach(player => {
      console.log(`  - ${player.name} (${player.position}, ${player.fantasy_value}): ${player.fantasy_context}`);
    });
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Team Prompt Context Generation
  console.log('📋 Test 4: Team Prompt Context Generation');
  const bengals = getTeamData('bengals');
  if (bengals) {
    const promptContext = generateTeamPromptContext(bengals, 'fantasy', 'clean');
    console.log('Bengals Prompt Context:');
    console.log(promptContext);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 5: Example Puns Generation
  console.log('📋 Test 5: Example Puns Generation');
  testTeams.forEach(teamKey => {
    const team = getTeamData(teamKey);
    if (team) {
      const examples = getTeamExamplePuns(team);
      console.log(`\n${team.name} Example Puns:`);
      examples.forEach(example => {
        console.log(`  - ${example}`);
      });
    }
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 6: NFL Team Detection
  console.log('📋 Test 6: NFL Team Detection');
  const testInputs = [
    'bengals',
    'Boston',
    'chiefs',
    'Chicago',
    'eagles',
    'England',
    'cowboys',
    'Canada'
  ];

  testInputs.forEach(input => {
    const isTeam = isNFLTeam(input);
    console.log(`${input.padEnd(15)} → ${isTeam ? 'NFL Team' : 'Not NFL Team'}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // Test 7: Available Teams
  console.log('📋 Test 7: Available Teams');
  const availableTeams = getAvailableTeams();
  console.log(`Total teams in database: ${availableTeams.length}`);
  console.log('Available teams:');
  availableTeams.forEach(teamKey => {
    const team = getTeamData(teamKey);
    console.log(`  - ${teamKey}: ${team?.name}`);
  });

  console.log('\n✅ Team recognition testing complete!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testTeamRecognition().catch(console.error);
}

export { testTeamRecognition }; 