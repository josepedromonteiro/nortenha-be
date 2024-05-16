import { HttpStatus, Injectable } from '@nestjs/common';
import { WordpressService } from '../wordpress/wordpress.service';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as FormData from 'form-data';
import { WoocommerceService } from '../woocommerce/woocommerce.service';
import axios from 'axios';
import { Category } from '../../models/woo/category';
import { Product } from '../../models/woo/product';
import { VendusService } from '../vendus/vendus.service';
import { PdfGeneratorService } from '../pdf-generator/pdf-generator.service';
import { VendusProduct } from '../../models/vendus/product';

const CSV_FILE = 'products.csv';

@Injectable()
export class ProductService {
  constructor(
    public wpService: WordpressService,
    public wooService: WoocommerceService,
    public vendusService: VendusService,
    public pdfGenerator: PdfGeneratorService,
  ) {}

  public async generateProductTags(products?: VendusProduct[]) {
    if (products) {
      return this.pdfGenerator.generatePDF(products);
    }

    return null;
    this.vendusService.getProducts().then((prd) => {
      // const p = products.slice(0, 100);
      return this.pdfGenerator.generatePDF(prd);
    });
  }

  public async addProductsFromVendusAPI({ syncImages = false }) {
    return this.vendusService
      .getProducts(
        { elementsPerPage: 1000, pageNumber: 0 },
        {
          status: 'on',
        },
      )
      .then(async (products) => {
        const products_ = products;
        for await (const product of products_) {
          try {
            const externalId = `${product.id}`;
            const productExists = await this.checkIfProductExists(externalId);
            let vendusImageUrl = undefined;
            if (syncImages || !productExists) {
              vendusImageUrl = product.images?.m?.replace('_m', '');
              //this will only remove the previous images, since it will add automatically when creating the product
              await this.uploadImage(vendusImageUrl, externalId, true);
            }

            const category = await this.vendusService.getCategoryById(
              product.category_id,
            );

            const vat = await this.vendusService.getTaxById(product.tax_id);
            const unit = await this.vendusService.getUnitById(product.unit_id);

            await this.createProduct(
              product.title,
              product.prices?.[0]?.price,
              product.description,
              externalId,
              category?.title,
              vendusImageUrl,
              unit,
              vat?.rate?.toString(),
              product?.barcode,
              product,
            );
            console.log(`Finished adding ${product.title}`);
          } catch (error) {
            console.error(`Failed to create product: ${error}`);
          }
        }
      });
  }

  public addProductsFromCSVFile() {
    const csvPipe = fs.createReadStream(CSV_FILE).pipe(csv({ separator: ';' }));

    csvPipe
      .on('data', async (row) => {
        csvPipe.pause();
        const {
          name,
          price,
          description,
          reference,
          barcode,
          category,
          image,
          unity,
          vat,
        } = row;
        try {
          const externalId = `${reference}-${barcode}`;
          const imageUrl = await this.uploadImage(image, externalId);
          await this.createProduct(
            name,
            price,
            description,
            externalId,
            category,
            imageUrl,
            unity,
            vat,
            barcode,
            undefined,
          );
        } catch (error) {
          console.error(`Failed to create product: ${error}`);
        }
        csvPipe.resume();
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
      });
  }

  private generateUUID = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  private checkIfProductExists = (sku: string) => {
    return this.wpService
      .request(`products?sku=${sku}`, 'get')
      .then((res) => {
        if (res.status == HttpStatus.OK) {
          console.log(res.data);
          return res.data;
        }
        return [];
      })
      .then((products) => {
        return (products?.length || 0) > 0;
      })
      .catch(() => {
        return false;
      });
  };
  // Function to upload image to WordPress
  private uploadImage = async (
    imageUrl,
    productId,
    onlyRemove = false,
  ): Promise<string> => {
    if (!imageUrl) return null;
    if (productId) {
      await this.removeProductImage(productId);
    }

    if (onlyRemove) {
      return;
    }

    const file: ArrayBuffer = await axios
      .get(imageUrl, { responseType: 'arraybuffer' })
      .then((res) => res.data);

    const formData = new FormData();
    formData.append('file', file, { filename: `${productId}.jpg` });

    return this.wpService
      .request('media', 'post', formData)
      .then((res) => {
        if (res?.data?.source_url) {
          return res.data.source_url;
        }

        console.log('uploading media...');

        const regex = /\{.*}/; // Regular expression to match anything between curly braces
        const match = res.data.match(regex);
        if (match) {
          const extractedJSON = match[0];
          const jsonObject = JSON.parse(extractedJSON);
          console.log('new media', jsonObject.source_url);
          return jsonObject.source_url;
        } else {
          console.log('No JSON found in the string.');
          return null;
        }
      })
      .catch((e) => {
        // const existingImage = e.response?.data?.data?.resource_id;

        const regex = /as post (.*?)!/s; // Regular expression to match 'as post' followed by anything until '!'
        const match = e.response?.data?.message?.match(regex);

        if (match) {
          const extractedPostId = match[1];
          return this.wpService
            .request(`media/${extractedPostId}`, 'get')
            .then((result) => {
              console.log('media exists', result.data.source_url);
              return result.data.source_url;
            });
        } else {
          console.log('Media -> No match found.');
        }
        return null;
      });
  };

  private removeProductImage = async (productId) => {
    // console.log(productId);
    return this.wooService.instance
      .get(`products`, {
        sku: productId,
      })
      .then(async (response) => {
        if (
          !response.data?.[0]?.images?.length ||
          response.data?.[0]?.images?.length <= 0
        ) {
          return;
        }
        await Promise.all(
          response.data[0].images.map((imageData) =>
            this.wpService
              .request(`media/${imageData.id}?force=true`, 'delete')
              .then((res) => {
                console.log('Media deleted succesfully', res.data?.deleted);
              })
              .catch((e) => {
                console.log('error', e);
              }),
          ),
        );
      })
      .catch((e) => {
        console.error(`Error fetching product ${productId}`, e?.response?.data);
      });
  };

  // Function to create a product using WooCommerce REST API
  private createProduct = async (
    name,
    price,
    description,
    external_id,
    category,
    image,
    unity,
    vat,
    barcode,
    posData,
  ) => {
    const metadata = [
      {
        key: 'unity',
        value: unity,
      },
      {
        key: 'barcode',
        value: barcode,
      },
      {
        key: 'posData',
        value: JSON.stringify(posData),
      },
    ];
    const payload: RecursivePartial<Product> = {
      name,
      type: 'simple',
      regular_price: price,
      description,
      sku: external_id,
      categories: [{ id: await this.handleCategory(category) }],
      meta_data: metadata as any,
      tax_class: vat,
    };
    if (image) {
      payload.images = [{ src: image, name: external_id }];
    }

    return this.wooService.instance
      .post('products', payload)
      .then((response) => {
        console.log('Product created successfully', response?.data?.id);
        return response;
      })
      .catch((e) => {
        const existingProductId = e?.response?.data?.data?.resource_id;
        if (existingProductId) {
          console.warn('Product exists, updating...', existingProductId);

          return this.updateProduct(existingProductId, payload);
        } else {
          console.error('Error creating product', e?.response?.data);
        }
      });
  };

  private updateProduct = (
    productId: number,
    productData: RecursivePartial<Product>,
  ) => {
    return this.wooService.instance
      .put(`products/${productId}`, productData)
      .then((response) => {
        console.log('Product updated successfully', response?.data?.id);
        return response;
      })
      .catch((e) => {
        console.error('Error updating product', e);
      });
  };

  private handleCategory = async (categoryName: string): Promise<number> => {
    const payload: Partial<Category> = {
      name: categoryName,
    };

    return this.wooService.instance
      .post('products/categories', payload)
      .then((createdCategory: Category) => {
        return createdCategory.id;
      })
      .catch((e) => {
        const resourceId = e?.response?.data?.data?.resource_id;
        if (resourceId) {
          console.warn('Category exists w/ ID:', resourceId);
          return resourceId;
        } else {
          console.error('Error creating category', e?.response);
        }
      });
  };
}
