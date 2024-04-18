export interface VendusProduct {
  id: number;
  order: number;
  reference: string;
  barcode: string;
  supplier_code: string;
  title: string;
  description: string;
  include_description: string;
  supply_price: string;
  gross_price: string;
  price_without_tax: string;
  prices: VendusPrice[];
  unit_id: number;
  class_name: string;
  type_id: string;
  compound: VendusCompound;
  lot_control: number;
  stock_control: number;
  stock_type: string;
  tax_id: string;
  tax_exemption: string;
  tax_exemption_law: string;
  category_id: number;
  brand_id: number;
  status: string;
  stock: number;
  stock_store: VendusStockStore[];
  stock_alert: number;
  stores: VendusStores;
  images?: VendusImage;
}

export interface VendusImage {
  xs?: string;
  m?: string;
}

export interface VendusPrice {
  id: number;
  price: string;
  price_without_tax: string;
}

export interface VendusCompound {
  stock: VendusStock;
}

export interface VendusStock {
  stock: number;
  store_id: number;
  stock_alert: number;
}

export interface VendusStockStore {
  store: string;
  store_id: number;
  qty: number;
}

export interface VendusStores {
  store: string;
  store_id: number;
}
