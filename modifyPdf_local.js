import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile, writeFile } from 'fs/promises'; // Import readFile

async function modifyPdf() {
  // Specify the path to your local PDF file
  const pdfPath = 'InvoiceFormat.pdf'; // Change this to the path of your PDF file
  
  // Read the PDF file from your local filesystem
  const existingPdfBytes = await readFile(pdfPath).then(buffer => buffer.buffer);

  // Load a PDFDocument from the existing PDF bytes
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Embed the Helvetica font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Get the width and height of the first page
  const { width, height } = firstPage.getSize();

  // Draw a string of text diagonally across the first page
  firstPage.drawText('This text was added with JavaScript!', {
    x: 5,
    y: height / 2 + 300,
    size: 50,
    font: helveticaFont,
    color: rgb(0.95, 0.1, 0.1),
    rotate: degrees(-45),
  });

  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();

  // Write the PDF to a file
  await writeFile('modified.pdf', Buffer.from(pdfBytes));
}

// Run the modifyPdf function and catch any errors
modifyPdf().catch(err => {
  console.error(err);
});
