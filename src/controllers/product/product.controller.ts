import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ProductService } from '../../services/product/product.service';
import { VendusProduct } from '../../models/vendus/product';
import { Response } from 'express';
import * as path from 'path';

@Controller('product')
export class ProductController {
  constructor(public productService: ProductService) {}

  @Get('add-products')
  addProducts() {
    return this.productService.addProductsFromCSVFile();
  }

  @Get('add-vendus-products')
  addProductsVendus() {
    return this.productService.addProductsFromVendusAPI();
  }

  @Get('generate-tags')
  generateTags() {
    return this.productService.generateProductTags();
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
