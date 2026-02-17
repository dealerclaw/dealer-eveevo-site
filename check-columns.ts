import XLSX from 'xlsx';

const workbook = XLSX.readFile('/home/ubuntu/upload/onautoaip-FULL-EXPORT-Ev-Petrol-Hybrid18-12-25(1).xlsx', {
  sheetRows: 2 // Only read first 2 rows
});

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

console.log('Sample row (first row of data):');
console.log(JSON.stringify(data[0], null, 2));
console.log('\nColumn names:');
console.log(Object.keys(data[0]).join(', '));
