import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { ProductService } from '../../services/product/product.service';
import { VendusProduct } from '../../models/vendus/product';
import { Response } from 'express';

@Controller('product')
export class ProductController {
  constructor(public productService: ProductService) {}

  @Get('add-products')
  addProducts() {
    return this.productService.addProductsFromCSVFile();
  }

  @Get('add-vendus-products/:id')
  addProductVendus(@Param('id') vendusId: number) {
    console.log(vendusId);
    return this.productService.addProductFromVendusAPI(vendusId, {
      syncImages: true,
    });
  }

  @Get('add-vendus-products')
  addProductsVendus() {
    return this.productService.addProductsFromVendusAPI({ syncImages: true });
  }

  @Get('generate-tags')
  generateTags() {
    return this.productService.generateProductTags();
  }

  @Get('generate-inventory-sheet')
  @Header('content-type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=inventory.pdf')
  async generateInventorySheet(@Res() response: Response) {
    const pdf = await this.productService.generateInventorySheet();
    pdf.pipe(response);
  }

  @Post('generate-tag')
  @Header('content-type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename=etiquetas.pdf')
  async generateTagsFromBody(
    @Body() products: VendusProduct[],
    @Res() response: Response,
  ) {
    const pdf = await this.productService.generateProductTags(products);
    pdf.pipe(response);
  }
}
