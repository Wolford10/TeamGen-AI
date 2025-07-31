# Training Data Generation Script

This script processes your CSV file of team name generation inputs and creates training data for fine-tuning your AI model.

## Prerequisites

1. Make sure your Next.js app is running locally:
   ```bash
   npm run dev
   ```

2. Install the required dependencies:
   ```bash
   npm install
   ```

3. Ensure your `team_name_finetune_inputs.csv` file is in the project root directory.

## Usage

Run the script to generate training data:

```bash
npm run generate-training-data
```

## What the Script Does

1. **Reads** your input CSV file (`team_name_finetune_inputs.csv`)
2. **Processes** each row by calling your `/api/generate` endpoint
3. **Saves** the results to `team_name_generation_outputs.csv`

## Input CSV Format

Your input CSV should have these columns:
- `sport` - The sport (e.g., "basketball", "football")
- `location` - Location or "none"
- `fantasyOrReal` - "fantasy" or "real"
- `appropriate` - "yes" or "no"
- `keywords` - Additional keywords or "no"
- `playerName` - Player name or "none"

## Output CSV Format

The output CSV will have these columns:
- All original input columns
- `generatedNames` - Newline-separated list of generated team names
- `rating` - Empty column for manual ratings (1-5)

## Example Output

```csv
sport,location,fantasyOrReal,appropriate,keywords,playerName,generatedNames,rating
basketball,Seattle,fantasy,yes,coffee,,Seattle Slam Dunkers
Emerald City Ballers
Coffee Bean Bouncers
Puget Sound Shooters
Rain City Rebels,
```

## Next Steps

After running the script:

1. **Review** the generated names in the output CSV
2. **Rate** each row (1-5) in the rating column
3. **Remove** any rows with poor quality names
4. **Use** the cleaned data for fine-tuning your model

## Troubleshooting

- **API Connection Error**: Make sure your Next.js app is running on `http://localhost:3000`
- **CSV Not Found**: Ensure `team_name_finetune_inputs.csv` is in the project root
- **Rate Limiting**: The script includes a 1-second delay between API calls to avoid overwhelming your server 