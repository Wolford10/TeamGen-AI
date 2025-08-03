import nflTeams from '../data/nfl-teams.json';

export interface Player {
  name: string;
  position: string;
  fantasy_value: string;
  pun_opportunities: string[];
  fantasy_context: string;
}

export interface Team {
  name: string;
  city: string;
  nickname: string;
  stadium: string;
  players: Player[];
}

export interface TeamData {
  teams: Record<string, Team>;
}

// Team name mapping for flexible recognition
const teamNameMapping: Record<string, string> = {
  // Full team names
  'cincinnati bengals': 'bengals',
  'kansas city chiefs': 'chiefs',
  'philadelphia eagles': 'eagles',
  'dallas cowboys': 'cowboys',
  'buffalo bills': 'bills',
  'san francisco 49ers': '49ers',
  'baltimore ravens': 'ravens',
  'miami dolphins': 'dolphins',
  'detroit lions': 'lions',
  'green bay packers': 'packers',
  
  // City names
  'cincinnati': 'bengals',
  'kansas city': 'chiefs',
  'philadelphia': 'eagles',
  'dallas': 'cowboys',
  'buffalo': 'bills',
  'san francisco': '49ers',
  'baltimore': 'ravens',
  'miami': 'dolphins',
  'detroit': 'lions',
  'green bay': 'packers',
  
  // Team nicknames
  'bengals': 'bengals',
  'chiefs': 'chiefs',
  'eagles': 'eagles',
  'cowboys': 'cowboys',
  'bills': 'bills',
  '49ers': '49ers',
  'niners': '49ers',
  'ravens': 'ravens',
  'dolphins': 'dolphins',
  'lions': 'lions',
  'packers': 'packers',
  
  // Common variations
  'cincy': 'bengals',
  'kc': 'chiefs',
  'philly': 'eagles',
  'sf': '49ers',
  'bal': 'ravens',
  'gb': 'packers',
};

/**
 * Recognize NFL team from user input
 */
export function recognizeTeam(location: string): string | null {
  if (!location) return null;
  
  const normalizedLocation = location.toLowerCase().trim();
  
  // Direct match
  if (teamNameMapping[normalizedLocation]) {
    return teamNameMapping[normalizedLocation];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(teamNameMapping)) {
    if (key.includes(normalizedLocation) || normalizedLocation.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Get team data by team key
 */
export function getTeamData(teamKey: string): Team | null {
  const teams = (nflTeams as TeamData).teams;
  return teams[teamKey] || null;
}

/**
 * Get team data by location (recognizes team first)
 */
export function getTeamByLocation(location: string): Team | null {
  const teamKey = recognizeTeam(location);
  if (!teamKey) return null;
  return getTeamData(teamKey);
}

/**
 * Get fantasy-relevant players for a team
 */
export function getFantasyPlayers(teamKey: string): Player[] {
  const team = getTeamData(teamKey);
  if (!team) return [];
  
  // Filter to only fantasy-relevant players (high and medium value)
  return team.players.filter(player => 
    player.fantasy_value === 'high' || player.fantasy_value === 'medium'
  );
}

/**
 * Get all players for a team (including low value for puns)
 */
export function getAllPlayers(teamKey: string): Player[] {
  const team = getTeamData(teamKey);
  return team?.players || [];
}

/**
 * Get player by name from a team
 */
export function getPlayerByName(teamKey: string, playerName: string): Player | null {
  const team = getTeamData(teamKey);
  if (!team) return null;
  
  return team.players.find(player => 
    player.name.toLowerCase().includes(playerName.toLowerCase()) ||
    playerName.toLowerCase().includes(player.name.toLowerCase())
  ) || null;
}

/**
 * Generate team-specific prompt context
 */
export function generateTeamPromptContext(team: Team, style: string, cleanOrDirty: string): string {
  const playerNames = team.players.map(p => p.name).join(', ');
  const fantasyPlayers = getFantasyPlayers(Object.keys((nflTeams as TeamData).teams).find(key => 
    (nflTeams as TeamData).teams[key].name === team.name
  ) || '');
  const fantasyPlayerNames = fantasyPlayers.map(p => p.name).join(', ');
  
  return `
TEAM-BASED FANTASY FOOTBALL CONTEXT:
- Location "${team.city}" recognized as ${team.name}
- Team nickname: ${team.nickname}
- Stadium: ${team.stadium}
- All players: ${playerNames}
- Fantasy-relevant players: ${fantasyPlayerNames}

Generate 5 fantasy football team names based on players from ${team.name}.
Each name should be a pun on a player name and include fantasy football context.
Focus on players with high and medium fantasy value for better relevance.

TEAM CULTURE INTEGRATION:
- Use team nickname: ${team.nickname}
- Reference team city: ${team.city}
- Include fantasy football terminology: dynasty, value, draft position
- Combine player puns with team culture and fantasy themes

STYLE: ${style}
TONE: ${cleanOrDirty}
`;
}

/**
 * Get example puns for a team
 */
export function getTeamExamplePuns(team: Team): string[] {
  const examples: string[] = [];
  
  // Add team-specific examples based on players
  team.players.forEach(player => {
    if (player.fantasy_value === 'high' || player.fantasy_value === 'medium') {
      const lastName = player.name.split(' ').pop() || '';
      const firstName = player.name.split(' ')[0] || '';
      
      // Generate example puns
      if (lastName.toLowerCase() === 'burrow') {
        examples.push('Burrowed Time', 'Better Business Burrow', 'Burrow Dynasty');
      } else if (lastName.toLowerCase() === 'chase') {
        examples.push('Chase Dynasty', 'Chase the Dream', 'Chase Kings');
      } else if (lastName.toLowerCase() === 'mahomes') {
        examples.push('Mahomes Dynasty', 'Mahomes Kings', 'Mahomes Heroes');
      } else if (lastName.toLowerCase() === 'hurts') {
        examples.push('Hurts So Good', 'Hurts Dynasty', 'Hurts Kings');
      } else if (lastName.toLowerCase() === 'allen') {
        examples.push('Allen Dynasty', 'Allen Kings', 'Allen Heroes');
      } else if (lastName.toLowerCase() === 'mccaffrey') {
        examples.push('CMC Dynasty', 'CMC Kings', 'CMC Heroes');
      }
    }
  });
  
  // Add team culture examples
  if (team.nickname.toLowerCase().includes('who dey')) {
    examples.push('Who Dey Dynasty', 'Who Dey Kings');
  } else if (team.nickname.toLowerCase().includes('kingdom')) {
    examples.push('Chiefs Kingdom', 'Kingdom Dynasty');
  } else if (team.nickname.toLowerCase().includes('philly')) {
    examples.push('Philly Dynasty', 'Philly Kings');
  }
  
  return examples.slice(0, 5); // Return top 5 examples
}

/**
 * Check if location is an NFL team
 */
export function isNFLTeam(location: string): boolean {
  return recognizeTeam(location) !== null;
}

/**
 * Get all available team keys
 */
export function getAvailableTeams(): string[] {
  return Object.keys((nflTeams as TeamData).teams);
} 