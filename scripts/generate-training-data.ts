import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

interface InputRow {
  sport: string;
  location: string;
  fantasyOrReal: string;
  appropriate: string;
  keywords: string;
  playerName: string;
}

interface OutputRow {
  sport: string;
  location: string;
  fantasyOrReal: string;
  appropriate: string;
  keywords: string;
  playerName: string;
  generatedNames: string;
  rating: string;
}

async function callGenerateAPI(input: InputRow): Promise<string[]> {
  try {
    // Map the CSV fields to your API's expected format
    const requestBody = {
      sport: input.sport,
      location: input.location === 'none' ? '' : input.location,
      style: input.fantasyOrReal,
      cleanOrDirty: input.appropriate === 'yes' ? 'clean' : 'dirty',
      extra: input.keywords === 'no' ? '' : input.keywords,
      level: 'adult',
      player: input.playerName === 'none' ? '' : input.playerName,
    };

    console.log(`Processing: ${input.sport} in ${input.location} (${input.fantasyOrReal})`);

    const response = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.names || [];
  } catch (error) {
    console.error(`Error calling API for row:`, input, error);
    return [];
  }
}

async function processCSV() {
  try {
    // Read the input CSV file
    const inputPath = path.join(process.cwd(), 'team_name_finetune_inputs.csv');
    const outputPath = path.join(process.cwd(), 'team_name_generation_outputs.csv');
    
    console.log('Reading input CSV file...');
    const csvContent = fs.readFileSync(inputPath, 'utf-8');
    
    // Parse the CSV
    const records: InputRow[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`Found ${records.length} rows to process`);
    
    const outputRows: OutputRow[] = [];
    
    // Process each row
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      console.log(`Processing row ${i + 1}/${records.length}...`);
      
      // Add a small delay to avoid overwhelming the API
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const generatedNames = await callGenerateAPI(row);
      
      const outputRow: OutputRow = {
        sport: row.sport,
        location: row.location,
        fantasyOrReal: row.fantasyOrReal,
        appropriate: row.appropriate,
        keywords: row.keywords,
        playerName: row.playerName,
        generatedNames: generatedNames.join('\n'),
        rating: '', // Empty field for manual rating later
      };
      
      outputRows.push(outputRow);
      
      console.log(`Generated ${generatedNames.length} names for row ${i + 1}`);
    }
    
    // Write the output CSV
    const outputCsv = stringify(outputRows, {
      header: true,
      columns: [
        'sport',
        'location', 
        'fantasyOrReal',
        'appropriate',
        'keywords',
        'playerName',
        'generatedNames',
        'rating'
      ]
    });
    
    fs.writeFileSync(outputPath, outputCsv);
    
    console.log(`\n✅ Successfully processed ${outputRows.length} rows`);
    console.log(`📁 Output saved to: ${outputPath}`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the generated names in the output CSV`);
    console.log(`2. Add ratings (1-5) in the rating column`);
    console.log(`3. Remove any rows with poor quality names`);
    console.log(`4. Use the cleaned data for fine-tuning`);
    
  } catch (error) {
    console.error('Error processing CSV:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  processCSV();
} 