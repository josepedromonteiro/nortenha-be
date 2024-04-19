import { Injectable } from '@nestjs/common';
import { VendusProduct } from '../../models/vendus/product';
import * as fs from 'fs';
import { imageSync } from 'qr-image';
import * as PDFDocument from 'pdfkit';
import { VendusService } from '../vendus/vendus.service';

@Injectable()
export class PdfGeneratorService {
  constructor(protected vendusService: VendusService) {}

  // Function to generate QR code image
  private generateQRCode(text, path) {
    const qr_png = imageSync(text, { type: 'png' });
    fs.writeFileSync(path, qr_png);
  }

  async generatePDF(products: VendusProduct[]) {
    const doc = new PDFDocument();

    // Stream the PDF to a file
    const stream = fs.createWriteStream('grocery_tags.pdf');
    doc.pipe(stream);

    // Calculate positions
    const startX = 30;
    const startY = 30;
    const tagWidth = 170; // Tag width in mm
    const tagHeight = 90; // Tag height in mm
    const gutterX = 0; // Horizontal space between tags
    const gutterY = 0; // Vertical space between tags
    const tagsPerRow = 3;
    const tagsPerPage = 21;

    let currentX = startX;
    let currentY = startY;
    let tagsGenerated = 0;

    for await (const [index, product] of products.entries()) {
      // // Add product details to the PDF
      // doc.text(product.title, { align: 'center' });
      // doc.moveDown();
      // doc.text(`Price: ${product.prices?.[0]?.price}`);
      // doc.moveDown();
      // doc.text(
      //   `Unit: ${await this.vendusService.getUnitById(product.unit_id)}`,
      // );
      // doc.moveDown();
      // // Add logo
      // doc.image('assets/logo_nortenha.png', { width: 100, align: 'center' });
      // doc.moveDown();
      // // Generate QR code for each product
      // const qrPath = `${product.id}_qr.png`;
      // this.generateQRCode(product.barcode, qrPath);
      // doc.image(qrPath, { width: 100, align: 'center' });
      // doc.moveDown();
      //
      // fs.rmSync(qrPath);
      //
      // // Add page break for next product
      // doc.addPage();

      // Calculate positions
      // const startX = 30;
      // const startY = 30;
      // const tagWidth = 210; // A4 width in mm
      // const tagHeight = 100; // A4 height in mm
      // const leftSideWidth = 100;
      // const rightSideWidth = tagWidth - leftSideWidth;

      // Left side

      if (tagsGenerated % tagsPerPage === 0) {
        // Start a new page for every set of 24 tags
        if (tagsGenerated !== 0) {
          console.log(
            `New page added, page index: ${tagsGenerated / 24}, tags generated: ${tagsGenerated}`,
          );
          doc.addPage();
          currentX = startX;
          currentY = startY;
        }
      }

      doc.opacity(0.2);
      doc.rect(currentX, currentY, tagWidth, tagHeight).stroke();
      doc.opacity(1);
      // doc.rect(startX, startY, leftSideWidth, tagHeight).fill('lightgrey');

      const title = product.title.trim();
      const titleOptions = {
        width: tagWidth - 5,
        ellipsis: true,
        lineBreak: true,
        height: 30,
      };

      doc
        .fontSize(11)
        .opacity(0.9)
        .font('Helvetica-Bold')
        .text(title, currentX + 5, currentY + 7, titleOptions);

      const titleHeight = doc.heightOfString(title, titleOptions);

      // doc
      //   .fontSize(8)
      //   .opacity(0.7)
      //   .font('Helvetica-Bold')
      //   .text(
      //     `${(await this.vendusService.getBrandtById(product.brand_id))?.title ?? ''}`,
      //     currentX + 5,
      //     currentY + titleHeight + 9,
      //     {
      //       width: tagWidth / 2,
      //       ellipsis: true,
      //       lineBreak: true,
      //       height: 10,
      //     },
      //   );

      doc
        .fontSize(7)
        .opacity(0.5)
        .font('Helvetica')
        .text(
          `${product.description}`,
          currentX + 5,
          currentY + titleHeight + 9,
          {
            width: tagWidth / 2 + 15,
            ellipsis: true,
            lineBreak: true,
            height: 20,
          },
        );

      doc
        .fontSize(21)
        .opacity(1)
        .font('Helvetica-Bold')
        .text(`${product.gross_price} €`, currentX + 5, currentY + 54, {
          width: tagWidth / 2,
          ellipsis: true,
          lineBreak: true,
        });

      doc
        .fontSize(10)
        .font('Helvetica')
        .opacity(0.5)
        .text(
          `${(await this.vendusService.getUnitById(product.unit_id)).title}`,
          currentX + 5,
          currentY + 76,
          {
            width: tagWidth / 2,
            ellipsis: true,
            lineBreak: true,
          },
        );

      doc.opacity(1);

      if (product.barcode) {
        // Right side
        const qrCodeWidth = tagHeight - 28;
        const qrCodeHeight = tagHeight - 28;

        // Generate and add QR code
        const qrPath = `${product.id}_qr.png`;
        this.generateQRCode(product.barcode, qrPath);
        doc.image(
          qrPath,
          currentX + tagWidth - qrCodeWidth - 1,
          currentY + tagHeight - qrCodeHeight - 1,
          { width: qrCodeWidth, height: qrCodeHeight },
        );

        // Remove generated QR code image
        fs.unlinkSync(qrPath);
      }

      // Move to next tag position
      currentX += tagWidth + gutterX;

      // Check if new row is needed
      if ((index + 1) % tagsPerRow === 0) {
        currentX = startX;
        currentY += tagHeight + gutterY;
      }

      tagsGenerated++;
    }

    // Finalize the PDF
    doc.end();

    console.log('PDF generated successfully!');

    return fs.createReadStream('grocery_tags.pdf');
  }
}
