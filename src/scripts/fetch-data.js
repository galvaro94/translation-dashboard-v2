const { GoogleSpreadsheet } = require('google-spreadsheet');
const fs = require('fs');
const path = require('path');

async function fetchSheetData() {
  try {
    console.log('🔄 Fetching data from Google Sheets...');
    
    // Initialize the sheet
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
    
    // Use service account credentials
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    await doc.useServiceAccountAuth(credentials);
    
    // Load sheet info and get first sheet
    await doc.loadInfo();
    console.log(`📄 Sheet title: ${doc.title}`);
    
    const sheet = doc.sheetsByIndex[0];
    console.log(`📋 Working with sheet: ${sheet.title}`);
    
    // Get all rows
    const rows = await sheet.getRows();
    console.log(`📊 Found ${rows.length} rows`);
    
    // Log headers to debug
    if (rows.length > 0) {
      console.log('📝 Headers detected:', rows[0]._sheet.headerValues);
    }
    
    // Convert to dashboard format
    // Assuming columns: Date Requested | Program | Language | Document Name | Deadline | Status | Completed Request Link
    const translations = rows.map((row, index) => {
      const rowData = row._rawData || [];
      
      return {
        id: index + 1,
        type: 'Translation',
        program: (rowData[1] || '').toString().trim(),
        title: (rowData[3] || '').toString().trim(),
        language: (rowData[2] || '').toString().trim(),
        status: (rowData[5] || 'Pending').toString().trim(),
        dateRequested: (rowData[0] || '').toString().trim(),
        date: (rowData[4] || '').toString().trim(),
        time: '',
        assignedTo: '',
        contact: '',
        link: (rowData[6] || '').toString().trim()
      };
    }).filter(item => {
      // Filter out empty rows
      return item.program && item.program !== '' && item.title && item.title !== '';
    });
    
    console.log(`✅ Processed ${translations.length} valid translation records`);
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save to JSON file
    const outputPath = path.join(dataDir, 'translations.json');
    fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));
    
    console.log(`💾 Data saved to ${outputPath}`);
    console.log(`📊 Summary: ${translations.length} translations`);
    
    // Log some sample data for verification
    if (translations.length > 0) {
      console.log('🔍 Sample record:', JSON.stringify(translations[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    
    // Create empty data file if it doesn't exist to prevent build failures
    const dataDir = path.join(process.cwd(), 'data');
    const outputPath = path.join(dataDir, 'translations.json');
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(outputPath)) {
      console.log('📝 Creating empty data file to prevent build failure');
      fs.writeFileSync(outputPath, JSON.stringify([], null, 2));
    }
    
    process.exit(1);
  }
}

// Run the function
fetchSheetData();
