export type ShopifyWebhookOrder = {
  id: number | string;
  name: string;
  order_number?: number;
  total_price: string;
  currency: string;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  email?: string | null;
  phone?: string | null;
  shipping_address?: {
    country_code?: string | null;
    name?: string | null;
    phone?: string | null;
  } | null;
  customer?: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  line_items: Array<{
    title: string;
    sku?: string | null;
    quantity: number;
    price: string;
    product_id?: number | string | null;
    variant_id?: number | string | null;
  }>;
};
