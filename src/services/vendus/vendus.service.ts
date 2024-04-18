import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse, Method } from 'axios';
import { VendusProduct } from '../../models/vendus/product';
import { VendusCategory } from '../../models/vendus/category';
import { VendusTax } from '../../models/vendus/tax';
import { VendusUnit } from '../../models/vendus/unit';
import { VendusBrand } from '../../models/vendus/brand';

const VENDUS_API_KEY = '7f3b87808d9b7dbd3b6b008d0db9f114';
const VENDUS_BASE_URL = 'https://www.vendus.pt/ws/v1.1';

interface Pagination {
  elementsPerPage: number;
  pageNumber: number;
}

export interface VendusRequestParams {
  url: string;
  baseUrl?: string;
  apiVersion?: string;
  method: Method;
  data?: any;
  params?: { [key: string]: any };
  pagination?: Pagination;
}

@Injectable()
export class VendusService {
  private categories?: VendusCategory[];
  private taxes?: VendusTax[];
  private units?: VendusUnit[];
  private brands?: VendusBrand[];

  public request = (params: VendusRequestParams) => {
    console.log({
      method: params.method,
      url: `${params.baseUrl ? `${params.baseUrl}/${params.apiVersion ? `${params.apiVersion}/` : ''}` : `${VENDUS_BASE_URL}/`}${params.url}`,
      data: params.data,
      params: {
        api_key: VENDUS_API_KEY,
        per_page: params?.pagination?.elementsPerPage,
        page: params?.pagination?.pageNumber,
        ...params.params,
      },
    });
    return axios({
      method: params.method,
      url: `${params.baseUrl ? `${params.baseUrl}/${params.apiVersion ? `${params.apiVersion}/` : ''}` : `${VENDUS_BASE_URL}/`}${params.url}`,
      data: params.data,
      params: {
        api_key: VENDUS_API_KEY,
        per_page: params?.pagination?.elementsPerPage,
        page: params?.pagination?.pageNumber,
        ...params.params,
      },
    });
  };

  public getProducts(params?: Pagination): Promise<VendusProduct[]> {
    return this.request({
      method: 'get',
      url: 'products',
      pagination: {
        elementsPerPage: params?.elementsPerPage ?? 1000,
        pageNumber: params?.pageNumber ?? 0,
      },
    })
      .then((response) => response.data)
      .catch((e) => {
        console.error(e);
      });
  }

  public getCategories(params?: Pagination): Promise<VendusCategory[]> {
    return this.categories
      ? Promise.resolve(this.categories)
      : this.request({
          method: 'get',
          url: 'products/brands',
          pagination: {
            elementsPerPage: params?.elementsPerPage ?? 1000,
            pageNumber: params?.pageNumber ?? 0,
          },
        })
          .then((response: AxiosResponse<VendusCategory[]>) => {
            this.categories = response.data;
            return this.categories;
          })
          .catch((e) => {
            console.error(e);
            return e;
          });
  }

  public getTaxes(params?: Pagination): Promise<VendusTax[]> {
    return this.taxes
      ? Promise.resolve(this.taxes)
      : this.request({
          method: 'get',
          url: 'taxes',
          pagination: {
            elementsPerPage: params?.elementsPerPage ?? 1000,
            pageNumber: params?.pageNumber ?? 0,
          },
        })
          .then((response: AxiosResponse<VendusTax[]>) => {
            this.taxes = response.data;
            return this.taxes;
          })
          .catch((e) => {
            console.error(e);
            return e;
          });
  }

  public getUnits(params?: Pagination): Promise<VendusUnit[]> {
    return this.taxes
      ? Promise.resolve(this.taxes)
      : this.request({
          method: 'get',
          url: 'products/units',
          pagination: {
            elementsPerPage: params?.elementsPerPage ?? 1000,
            pageNumber: params?.pageNumber ?? 0,
          },
        })
          .then((response: AxiosResponse<VendusUnit[]>) => {
            this.units = response.data;
            return this.units;
          })
          .catch((e) => {
            console.error(e);
            return e;
          });
  }

  public getBrands(params?: Pagination): Promise<VendusBrand[]> {
    return this.taxes
      ? Promise.resolve(this.taxes)
      : this.request({
          method: 'get',
          url: 'products/brands',
          pagination: {
            elementsPerPage: params?.elementsPerPage ?? 1000,
            pageNumber: params?.pageNumber ?? 0,
          },
        })
          .then((response: AxiosResponse<VendusBrand[]>) => {
            this.brands = response.data;
            return this.brands;
          })
          .catch((e) => {
            console.error(e);
            return e;
          });
  }

  public async getCategoryById(
    id: number,
  ): Promise<VendusCategory | undefined> {
    return (await this.getCategories())?.filter((cat) => cat.id == id)?.[0];
  }

  public async getTaxById(id: string): Promise<VendusTax | undefined> {
    return (await this.getTaxes())?.filter((tax) => tax.id == id)?.[0];
  }

  public async getUnitById(id: number): Promise<VendusUnit | undefined> {
    return (await this.getUnits())?.filter((tax) => tax.id == id)?.[0];
  }

  public async getBrandtById(id: number): Promise<VendusBrand | undefined> {
    return (await this.getBrands())?.filter((tax) => tax.id == id)?.[0];
  }
}
