export type ListingStatus = 'active' | 'matched' | 'closed'

export interface Listing {
  id: string
  seller_id: string
  user_id: string
  title: string
  commodity: string
  commodity_id: string | null
  quantity: number
  price_per_unit: number
  region: string
  description: string
  status: ListingStatus
  unit: string
  created_at: string | null
  updated_at: string | null
}

export interface ListingFilters {
  commodity?: string
  region?: string
  seller_id?: string
  status?: ListingStatus | 'open'
  limit?: number
}

export interface CreateListingInput {
  seller_id: string
  title?: string
  commodity: string
  commodity_id?: string | null
  quantity: number
  price_per_unit: number
  region: string
  description?: string
}

export interface ListingsResponse {
  listings: Listing[]
}
