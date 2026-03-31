import { getSupabaseServerClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile, UserTrustScore } from './trust.types';

const PROFILE_COMPLETENESS_WEIGHT = 0.2;
const VERIFICATION_STATUS_WEIGHT = 0.2;
const TRANSACTION_HISTORY_WEIGHT = 0.4;
const RESPONSE_RATE_WEIGHT = 0.2;

async function getProfileCompletenessScore(user: UserProfile): Promise<number> {
    let score = 0;
    if (user.region) {
        score += 10;
    }
    if (user.interests && user.interests.length > 0) {
        score += 10;
    }
    return score;
}

async function getVerificationStatusScore(user: UserProfile): Promise<number> {
    return user.verified ? 20 : 0;
}

async function getTransactionHistoryScore(userId: string, supabase: SupabaseClient): Promise<number> {
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('status')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

    if (error) {
        console.error('Error fetching transactions:', error);
        return 0;
    }

    let score = 0;
    for (const transaction of transactions) {
        if (transaction.status === 'completed') {
            score += 5;
        } else if (transaction.status === 'failed' || transaction.status === 'cancelled') {
            score -= 10;
        }
    }
    return Math.max(0, Math.min(40, score));
}

async function getResponseRateScore(userId: string, supabase: SupabaseClient): Promise<number> {
    const { data: negotiations, error } = await supabase
        .from('negotiations')
        .select('status,seller_id')
        .eq('seller_id', userId);

    if (error) {
        console.error('Error fetching negotiations:', error);
        return 0;
    }

    if (negotiations.length === 0) {
        return 10; // Neutral score for users with no negotiations
    }

    const respondedCount = negotiations.filter(n => n.status !== 'pending').length;
    const responseRate = (respondedCount / negotiations.length);
    return responseRate * 20;
}

export async function calculateTrustScore(userId: string): Promise<UserTrustScore | null> {
    const supabase = getSupabaseServerClient();
    const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !user) {
        console.error('Error fetching user:', error);
        return null;
    }

    const profileCompleteness = await getProfileCompletenessScore(user);
    const verificationStatus = await getVerificationStatusScore(user);
    const transactionHistory = await getTransactionHistoryScore(userId, supabase);
    const responseRate = await getResponseRateScore(userId, supabase);

    const totalScore =
        profileCompleteness * PROFILE_COMPLETENESS_WEIGHT +
        verificationStatus * VERIFICATION_STATUS_WEIGHT +
        transactionHistory * TRANSACTION_HISTORY_WEIGHT +
        responseRate * RESPONSE_RATE_WEIGHT;
    
    const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    const factors = {
        profileCompleteness,
        verificationStatus,
        transactionHistory,
        responseRate,
    };

    await supabase
        .from('user_profiles')
        .update({ trust_score: finalScore, factors: factors })
        .eq('user_id', userId);

    return {
        userId,
        score: finalScore,
        factors,
    };
}

export async function updateTrustScore(userId: string, event: string, change: number): Promise<void> {
    const supabase = getSupabaseServerClient();
    const { data: user, error } = await supabase
        .from('user_profiles')
        .select('trust_score')
        .eq('user_id', userId)
        .single();

    if (error || !user) {
        console.error('Error fetching user:', error);
        return;
    }

    const newScore = Math.max(0, Math.min(100, user.trust_score + change));

    await supabase
        .from('user_profiles')
        .update({ trust_score: newScore })
        .eq('user_id', userId);

    await supabase
        .from('user_trust_logs')
        .insert({
            user_id: userId,
            event,
            change,
            new_score: newScore,
        });
}

export async function getTrustScore(userId: string): Promise<UserTrustScore | null> {
    const supabase = getSupabaseServerClient();
    const { data: user, error } = await supabase
        .from('user_profiles')
        .select('trust_score, factors')
        .eq('user_id', userId)
        .single();

    if (error || !user) {
        console.error('Error fetching user:', error);
        return null;
    }

    return {
        userId,
        score: user.trust_score,
        factors: user.factors,
    };
}
