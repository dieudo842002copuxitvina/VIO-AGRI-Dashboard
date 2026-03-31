export interface UserTrustScore {
  userId: string;
  score: number;
  factors: {
    profileCompleteness: number;
    verificationStatus: number;
    transactionHistory: number;
    responseRate: number;
  };
}

export interface TrustLog {
  logId: string;
  userId: string;
  timestamp: Date;
  event: string;
  change: number;
  newScore: number;
}

export interface UserProfile {
    user_id: string;
    role: string;
    region: string | null;
    interests: string[] | null;
    trust_score: number;
    verified: boolean;
    created_at: string;
    updated_at: string;
    factors: Record<string, unknown>;
}

export interface Transaction {
    id: string;
    negotiation_id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface Negotiation {
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    offered_price: number;
    status: 'pending' | 'accepted' | 'rejected';
    note: string | null;
    commodity: string | null;
    region: string | null;
    listing_title: string | null;
    created_at: string;
    updated_at: string;
}
