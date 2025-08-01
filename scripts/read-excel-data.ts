import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

function readExcelFile() {
  try {
    const filePath = path.join(process.cwd(), 'team_name_finetune_inputs_20.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Excel file not found:', filePath);
      return;
    }

    console.log('📖 Reading Excel file:', filePath);
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('📋 Sheet name:', sheetName);
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log('\n📊 Data found:');
    console.log('Rows:', data.length);
    
    if (data.length > 0) {
      console.log('\n🔍 All rows:');
      data.forEach((row: any, index: number) => {
        if (index === 0) {
          console.log(`\n📝 HEADERS: ${row.join(' | ')}`);
        } else {
          console.log(`Row ${index}: ${row.join(' | ')}`);
        }
      });
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Error reading Excel file:', error);
    return null;
  }
}

// Run the script
if (require.main === module) {
  readExcelFile();
} 