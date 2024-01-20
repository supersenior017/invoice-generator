import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFile, writeFile } from 'fs/promises';

// pdf file destination
const inputPdfPath = 'InvoiceFormat.pdf';
const outputPdfPath = 'output.pdf';


// Coordinates mapping, you must replace these with your actual coordinates
const coordinates_origin = {
  contact_name: { x: 85, y: 676 },
  company_name: { x: 40, y: 636 },
  line_1: { x: 40, y: 627 },
  line_2: { x: 40, y: 618 },
  postal_code: { x: 40, y: 600 },
  city: { x: 40, y: 609 },
  state: { x: 90, y: 609 },
  country_alpha2: { x: 92, y: 590 },
  contact_phone: { x: 85, y: 665 },
  contact_email: { x: 65, y: 656 },
};

const coordinates_destination = {
  contact_name: { x: 85, y: 540 },
  company_name: { x: 40, y: 500 },
  line_1: { x: 40, y: 491 },
  line_2: { x: 40, y: 482 },
  postal_code: { x: 40, y: 464 },
  city: { x: 40, y: 473 },
  state: { x: 90, y: 473 },
  country_alpha2: { x: 92, y: 455 },
  contact_phone: { x: 85, y: 530 },
  contact_email: { x: 65, y: 520 },
};

const coordinates_item = {
  quantity: { x: 80, y: 392 },
  description: { x: 185, y: 392 },
  hs_code: { x: 345, y: 392 },
  // origin_country_alpha2: { x: 85, y: 392 },
  actual_weight: { x: 115, y: 392 },
  // declared_currency: { x: 485, y: 392 },
  unit_value: { x: 460, y: 392 },
  declared_customs_value: { x: 530, y: 392 },
};

// Initialize with the first row's Y position
const firstRowY = coordinates_item.quantity.y;
// Define the height of a row (this will be subtracted from the Y coordinate)
const rowHeight = 12;



const origin = {
  line_1: "line_1",
  line_2: "line_2",
  postal_code: "12345",
  state: "state",
  city: "city",
  country_alpha2: "US",
  contact_name: "John Doe",
  company_name: "Example Company",
  contact_phone: "555-555-5555",
  contact_email: "john.doe@example.com",
};

const destination = {
  company_name: "company_name", // Leave blank if not provided
  contact_name: "contact_name",
  line_1: "line_1",
  line_2: "line_2", // If any
  postal_code: "54321",
  city: "city",
  state: "state", 
  country_alpha2: "US",
  contact_phone: "555-555-5555",
  contact_email: "abc.def@gmail.com",
};

const items = [
  // Array of item objects as provided
  {
    quantity: 100,
    description: "description",
    hs_code: "hs_code", // Must set this
    origin_country_alpha2: "US",
    actual_weight: 1, 
    declared_currency: "USD",
    declared_customs_value: 100,
  },
  {
    quantity: 5,
    description: "Gadget B",
    hs_code: "654321",
    origin_country_alpha2: "US",
    actual_weight: 2.3,
    declared_currency: "USD",
    declared_customs_value: 250.50,
  }
];


const fontSize = 7;


function getCurrentDateFormatted() {
  const today = new Date();
  // Array of month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = today.getDate();
  const monthIndex = today.getMonth(); // January is 0!
  const year = today.getFullYear();

  // Format the date as "30 Nov, 2023"
  return `${day} ${monthNames[monthIndex]}, ${year}`;
}



function getRandomInvoiceNumber() {
  // Generate a random number with 6 digits
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return `${randomNum}`;
}


async function modifyPdf() {
  const existingPdfBytes = await readFile(inputPdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Embed a font
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  

  // Get the first page (0-based index)
  const page = pdfDoc.getPages()[0];

  const shippingDate = getCurrentDateFormatted();
  const invoiceNumber = getRandomInvoiceNumber();

  // Define the coordinates where you want to place the ship date and invoice number on the PDF
  const shipDateCoordinates = { x: 330, y: 695 }; // Example coordinates
  const invoiceNumberCoordinates = { x: 335, y: 659 }; // Example coordinates

  drawText(page, font, shippingDate, shipDateCoordinates);
  drawText(page, font, invoiceNumber, invoiceNumberCoordinates);

  // Draw the origin, destination, and items data
  drawData(page, font, origin, coordinates_origin);
  drawData(page, font, destination, coordinates_destination); // Ensure destination has its own set of coordinates

  // Draw each item with the correct Y offset
items.forEach((item, index) => {
  // Calculate the unit value
  let unitValue;
  if (item.quantity !== 0) {
    unitValue = item.declared_customs_value / item.quantity;
  } else {
    unitValue = 0;
  }


  // Calculate the Y position for the current item row
  const yOffset = firstRowY - index * rowHeight;

  // Adjust Y coordinate for each field of the item including the new "unit value"
  Object.entries(coordinates_item).forEach(([field, coord]) => {
    let fieldValue = item[field] !== undefined ? item[field].toString() : '';


    if (field === 'unit_value') {
      // If the field is 'unit value', set it to the calculated value
      fieldValue = unitValue.toFixed(2); // You can use toFixed to limit the number of decimal places
    }

    // Create a copy of the original coordinates and adjust the Y value
    const updatedCoord = { ...coord, y: yOffset };

    // Draw the item field with the updated coordinate
    drawData(page, font, { [field]: fieldValue }, { [field]: updatedCoord });
  });
});


  const pdfBytes = await pdfDoc.save();
  await writeFile(outputPdfPath, pdfBytes);
  console.log('PDF modified and saved.');
}


function drawData(page, font, data, coordinates) {
  Object.keys(data).forEach(field => {
    if (coordinates[field]) {
      const text = typeof data[field] === 'number' ? data[field].toString() : data[field];

      page.drawText(text || '', {
        x: coordinates[field].x,
        y: coordinates[field].y,
        size: fontSize,
        font: font,
        color: rgb(0.95, 0.1, 0.1),
      });
    }
  });
}

function drawText(page, font, text, coordinates) {
  page.drawText(text, {
    x: coordinates.x,
    y: coordinates.y,
    size: fontSize,
    font: font,
    color: rgb(0.95, 0.1, 0.1),
  });
}


modifyPdf().catch(err => console.error('Failed to modify PDF:', err));
