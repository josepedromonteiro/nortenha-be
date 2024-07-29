import { Injectable } from '@nestjs/common';
import { VendusProduct } from '../../models/vendus/product';
import * as fs from 'fs';
import * as PDFDocument from 'pdfkit';
import { VendusService } from '../vendus/vendus.service';

@Injectable()
export class InventoryPdfGeneratorService {
  constructor(protected vendusService: VendusService) {}

  async generatePDF(products: VendusProduct[]): Promise<fs.ReadStream> {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 40,
    });

    // Stream the PDF to a file
    const stream = fs.createWriteStream('inventory.pdf');
    doc.pipe(stream);

    // Title
    doc.font('Helvetica-Bold');
    doc.fontSize(20).text('Inventário Mercearia Nortenha', { align: 'center' });
    doc.moveDown();

    // Table Header
    doc.fontSize(10);
    const headers = [
      'Nome',
      'Marca',
      'Cód. Barras',
      'Preço',
      'Stock',
      'Check Stock',
      'Notas',
      'Ck.',
    ];

    // Adjusted column widths
    const columnWidths = {
      Nome: 150,
      Marca: 100,
      'Cód. Barras': 100,
      Preço: 50,
      Stock: 70,
      'Check Stock': 80,
      Notas: 200,
      'Ck.': 30,
    };

    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const tableWidth = Object.values(columnWidths).reduce(
      (acc, width) => acc + width,
      0,
    );
    const scaleFactor = pageWidth / tableWidth;

    const scaledColumnWidths = Object.fromEntries(
      Object.entries(columnWidths).map(([key, width]) => [
        key,
        width * scaleFactor,
      ]),
    );

    let startX = doc.page.margins.left;
    let startY = doc.y;
    const rowHeight = 20; // Adjust as needed for row height
    let currentCategory = undefined;

    const drawTableHeader = () => {
      headers.forEach((header) => {
        doc
          .rect(startX, startY, scaledColumnWidths[header], rowHeight)
          .stroke();
        doc.font('Helvetica-Bold').text(header, startX + 5, startY + 5, {
          width: scaledColumnWidths[header] - 10,
          align: 'center',
        });
        startX += scaledColumnWidths[header];
      });

      doc.moveDown();
      startY += rowHeight;
      startX = doc.page.margins.left;
    };

    const drawCategoryRow = async (cat: number) => {
      const category = await this.vendusService.getCategoryById(cat);
      const categoryText = `Categoria: ${category?.title ?? 'Sem categ.'}`;

      doc
        .fillColor('#DCDCDC')
        .rect(startX, startY, pageWidth, rowHeight)
        .fill();
      doc
        .fillColor('black')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(categoryText, startX + 5, startY + 5);

      startY += rowHeight;
      doc.moveDown();
    };

    const truncateText = (text: string, width: number): string => {
      const ellipsis = '...';
      const ellipsisWidth = doc.widthOfString(ellipsis) + 2;
      let truncatedText = text;

      while (
        doc.widthOfString(truncatedText) > width - ellipsisWidth &&
        truncatedText.length > 0
        ) {
        truncatedText = truncatedText.slice(0, -1);
      }

      return truncatedText.length === text.length
        ? text
        : truncatedText + ellipsis;
    };

    const drawRow = (row: string[], active: boolean) => {
      row.forEach((cell, i) => {
        const header = headers[i];
        const cellWidth = scaledColumnWidths[header];
        const truncatedCell = truncateText(cell, cellWidth - 10);

        doc.rect(startX, startY, cellWidth, rowHeight).stroke();
        doc.font('Helvetica').text(truncatedCell, startX + 5, startY + 5, {
          width: cellWidth - 10,
          align: 'center',
          strike: i == 0 && !active,
        });
        startX += cellWidth;
      });

      // Draw a rectangle for the checkmark
      const checkX = startX - scaledColumnWidths['Ck.'];
      doc.rect(checkX + 10, startY + 5, 10, 10).stroke();

      startY += rowHeight;
      startX = doc.page.margins.left;
    };

    const addNewPage = async (category_id: number) => {
      doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
      startY = doc.y;
      await drawCategoryRow(category_id); // Draw category header on new page
      drawTableHeader(); // Draw header on each new page
    };

    // Draw the table header initially
    if (products.length > 0) {
      currentCategory = products[0].category_id;
      await drawCategoryRow(currentCategory);
      drawTableHeader();
    }

    // Table Rows
    for (const product of products) {
      const { title, brand_id, barcode, gross_price, stock, category_id } =
        product;
      const brand = await this.vendusService.getBrandById(brand_id);

      // Check for category change
      if (currentCategory !== category_id) {
        currentCategory = category_id;
        if (startY + rowHeight * 2 > doc.page.height - doc.page.margins.bottom) {
          await addNewPage(category_id);
        } else {
          await drawCategoryRow(category_id);
        }
        drawTableHeader();
      }

      const row = [
        title,
        brand?.title ?? '',
        barcode,
        `${Number(gross_price).toFixed(2)} €`,
        stock.toString(),
        '',
        '',
        '',
      ];

      drawRow(row, product.status == 'on');

      // Check if a new page is needed
      if (startY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        await addNewPage(currentCategory);
      }
    }

    doc.end();

    console.log('PDF generated successfully!');

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(fs.createReadStream('inventory.pdf'));
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
