export type TransactionStatus = 'pending' | 'escrow' | 'released'
export type DeliveryStatus = 'awaiting_dispatch' | 'in_transit' | 'delivered' | 'completed'

export interface TransactionRecord {
  id: string
  negotiation_id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  status: TransactionStatus
  delivery_status: DeliveryStatus
  logistics_info: string
  created_at: string | null
  updated_at: string | null
}
