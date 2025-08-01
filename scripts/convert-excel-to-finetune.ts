import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

interface ExcelRow {
  sport: string;
  location: string;
  fantasyOrReal: string;
  appropriate: string;
  keywords: string;
  playerName: string;
  generatednames: string;
}

function convertExcelToFineTune() {
  try {
    const filePath = path.join(process.cwd(), 'team_name_finetune_inputs_20.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Excel file not found:', filePath);
      return;
    }

    console.log('📖 Reading Excel file:', filePath);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${data.length} training examples`);
    
    // Convert to fine-tuning format
    const fineTuneData = data.map((row, index) => {
      // Clean up the data
      const sport = row.sport?.toLowerCase() || '';
      const location = row.location?.toLowerCase() === 'none' ? '' : (row.location || '');
      const style = row.fantasyOrReal?.toLowerCase() || 'real';
      const cleanOrDirty = row.appropriate?.toLowerCase() === 'yes' ? 'clean' : 'dirty';
      const extra = row.keywords?.toLowerCase() === 'none' ? '' : (row.keywords || '');
      const player = row.playerName?.toLowerCase() === 'none' ? '' : (row.playerName || '');
      const teamNames = row.generatednames || '';
      
      // Create the user prompt
      const userPrompt = `sport: ${sport}, location: ${location}, style: ${style}, appropriate: ${cleanOrDirty}, keywords: ${extra}${player ? `, player: ${player}` : ''}`;
      
      // Create the assistant response (just the team names)
      const assistantResponse = teamNames;
      
      return {
        messages: [
          {
            role: "user",
            content: userPrompt
          },
          {
            role: "assistant", 
            content: assistantResponse
          }
        ]
      };
    });
    
    // Write to JSONL file
    const outputPath = path.join(process.cwd(), 'fine-tune-data.jsonl');
    const jsonlContent = fineTuneData.map(example => JSON.stringify(example)).join('\n');
    
    fs.writeFileSync(outputPath, jsonlContent);
    
    console.log(`✅ Converted ${data.length} examples to fine-tuning format`);
    console.log(`📁 Output saved to: ${outputPath}`);
    
    // Show a few examples
    console.log('\n🔍 Sample conversions:');
    fineTuneData.slice(0, 3).forEach((example, index) => {
      console.log(`\nExample ${index + 1}:`);
      console.log(`User: ${example.messages[0].content}`);
      console.log(`Assistant: ${example.messages[1].content}`);
    });
    
    // Create a summary
    console.log('\n📈 Data Summary:');
    const sports = [...new Set(data.map(row => row.sport?.toLowerCase()))];
    const styles = [...new Set(data.map(row => row.fantasyOrReal?.toLowerCase()))];
    const withPlayers = data.filter(row => row.playerName?.toLowerCase() !== 'none').length;
    
    console.log(`- Sports: ${sports.join(', ')}`);
    console.log(`- Styles: ${styles.join(', ')}`);
    console.log(`- Examples with players: ${withPlayers}`);
    console.log(`- Clean examples: ${data.filter(row => row.appropriate?.toLowerCase() === 'yes').length}`);
    console.log(`- Dirty examples: ${data.filter(row => row.appropriate?.toLowerCase() === 'no').length}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ Error converting Excel file:', error);
    return null;
  }
}

// Run the script
if (require.main === module) {
  convertExcelToFineTune();
} 