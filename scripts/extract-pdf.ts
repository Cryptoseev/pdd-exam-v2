/**
 * PDF to questions.json extractor
 * Usage: npx tsx scripts/extract-pdf.ts path/to/pdd-tickets.pdf
 *
 * After running, inspect scripts/raw-pdf.txt to understand the PDF layout,
 * then write a parser matching the actual structure.
 */
import fs from 'fs';
import path from 'path';

async function main() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Usage: npx tsx scripts/extract-pdf.ts <path-to-pdf>');
    process.exit(1);
  }

  const absPath = path.resolve(pdfPath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  // Dynamic import to avoid issues if pdf-parse is not installed
  let pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }>;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    pdfParse = require('pdf-parse');
  } catch {
    console.error('pdf-parse not installed. Run: npm install -D pdf-parse');
    process.exit(1);
  }

  console.log(`Reading PDF: ${absPath}`);
  const buffer = fs.readFileSync(absPath);
  const data = await pdfParse(buffer);

  const rawTxtPath = path.join(__dirname, 'raw-pdf.txt');
  fs.writeFileSync(rawTxtPath, data.text, 'utf-8');

  console.log(`✅ Raw text extracted to: ${rawTxtPath}`);
  console.log(`   Pages: ${data.numpages}`);
  console.log(`   Characters: ${data.text.length}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Open scripts/raw-pdf.txt and examine the structure');
  console.log('2. Identify how tickets, questions, and answers are formatted');
  console.log('3. Write a parser below in parseTickets() matching that structure');
  console.log('4. Uncomment the save block at the bottom to write data/questions.json');

  // TODO: replace this stub with a real parser based on the actual PDF structure
  // Example: parse tickets and questions from extracted text
  // const questions = parseTickets(data.text);
  // fs.writeFileSync(
  //   path.join(__dirname, '..', 'data', 'questions.json'),
  //   JSON.stringify({ tickets: questions }, null, 2),
  //   'utf-8'
  // );
  // console.log(`✅ Saved ${questions.length} tickets to data/questions.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
