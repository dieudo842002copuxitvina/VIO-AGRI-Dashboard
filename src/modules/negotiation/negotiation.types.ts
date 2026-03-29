export type NegotiationStatus = 'pending' | 'accepted' | 'rejected'

export interface NegotiationRecord {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  offered_price: number
  status: NegotiationStatus
  note: string
  commodity: string
  region: string
  listing_title: string
  created_at: string | null
  updated_at: string | null
}

export interface CreateNegotiationInput {
  listing_id: string
  buyer_id: string
  seller_id?: string
  offered_price: number
  note?: string
}

export interface RespondNegotiationInput {
  negotiation_id: string
  status: 'accepted' | 'rejected'
  note?: string
}
