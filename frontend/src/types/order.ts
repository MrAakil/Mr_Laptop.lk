export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  district: string;
  postal_code: string;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_number: string | null;
  notes: string | null;
  invoice_number: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderStats {
  total_orders: number;
  revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  average_order_value: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
