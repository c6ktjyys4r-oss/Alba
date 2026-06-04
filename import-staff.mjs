import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read staff data
const staffDataPath = path.join(__dirname, 'client/public/staff_import_data.json');
const staffData = JSON.parse(fs.readFileSync(staffDataPath, 'utf-8'));

console.log(`📋 Loaded ${staffData.length} staff records from Excel`);
console.log('\n✅ Staff data ready for import via Data Import page in the ERP UI');
console.log('\nTo import the data:');
console.log('1. Open the ERP system');
console.log('2. Navigate to "Data Import" from the sidebar');
console.log('3. Click "Start Import" button');
console.log('4. The system will create employees, departments, and branches automatically');
console.log('\nSample records:');
staffData.slice(0, 3).forEach((staff, idx) => {
  console.log(`\n${idx + 1}. ${staff['Full name english']} (${staff['الاسم كامل عربي']})`);
  console.log(`   Job: ${staff['Job title']}`);
  console.log(`   Department: ${staff['Departement']}`);
  console.log(`   Email: ${staff['Email ']}`);
});
