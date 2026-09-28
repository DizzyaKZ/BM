export type OrderStatus = 'NEW' | 'PREPARING' | 'PACKED_LABELED' | 'DELIVERED';
export type DeliverySlot = '08:00 - 09:30' | '13:00 - 14:00' | '18:30 - 20:00' | 'TAKEAWAY_PUB';

export interface OrderItem {
  id: string;
  productType?: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPriceKzt: number;
  totalKzt: number;
}

export interface AraiResidentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  block: 'Г1' | 'Г2' | 'Г3' | 'Г4' | 'Внешний клиент';
  apartment: string;
  deliveryDate: string;
  deliverySlot: DeliverySlot;
  items: OrderItem[];
  subtotalKzt: number;
  moodClubDiscountPct: number; // e.g. 10% for residents
  discountSumKzt: number;
  finalTotalKzt: number;
  paymentMethod: 'KASPI_QR' | 'CASH' | 'PUB_TAB';
  status: OrderStatus;
  isTsplPrinted: boolean;
  createdAt: string;
}
