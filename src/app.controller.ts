import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';

@Controller()
export class AppController {
  wcApi = new WooCommerceRestApi({
    url: 'https://companhianortenha.com',
    consumerKey: 'ck_3ea50e1dc09e1dcf773e7ca0018636b78611536a',
    consumerSecret: 'cs_12a76032e18991252c797de7c667300ee2a69532',
    version: 'wc/v3',
  });

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/delete-products')
  deleteProducts() {
    console.log('------ started deleting ------');
    this.wcApi
      .get('products', {
        per_page: 20, // 20 products per page
      })
      .then(async (response) => {
        for await (const product of response.data) {
          this.wcApi
            .delete(`products/${product.id}`, {
              force: true, // Forces to delete instead of move to the Trash
            })
            .then((response) => {
              // Successful request
              console.log('Response Status:', response.status);
            })
            .catch((error) => {
              // Invalid request, for 4xx and 5xx statuses
              console.log('Response Status:', error.response.status);
              console.log('Response Headers:', error.response.headers);
              console.log('Response Data:', error.response.data);
            })
            .finally(() => {
              // Always executed.
            });
        }

        console.log(`\nMissing -> ${response.data.length}\n`);
        if (response.data.length > 1) {
          return this.deleteProducts();
        } else {
          return null;
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }
}
