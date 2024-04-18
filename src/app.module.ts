import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductController } from './controllers/product/product.controller';
import { ProductService } from './services/product/product.service';
import { WordpressService } from './services/wordpress/wordpress.service';
import { WoocommerceService } from './services/woocommerce/woocommerce.service';
import { VendusService } from './services/vendus/vendus.service';
import { PdfGeneratorService } from './services/pdf-generator/pdf-generator.service';
import { BypassController } from './controllers/bypass/bypass.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [AppController, ProductController, BypassController],
  providers: [
    AppService,
    ProductService,
    WordpressService,
    WoocommerceService,
    VendusService,
    PdfGeneratorService,
  ],
  imports: [AuthModule, UsersModule, ConfigModule.forRoot()],
})
export class AppModule {}
