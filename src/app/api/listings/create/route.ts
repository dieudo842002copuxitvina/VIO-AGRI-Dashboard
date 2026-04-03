import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.delete({ name, ...options });
                },
            },
        }
    );

    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { type, commodity, quantity, price } = body;

        if (!type || !commodity || !quantity || price === undefined) {
            return NextResponse.json({ error: 'Missing required fields: type, commodity, quantity, and price are required.' }, { status: 400 });
        }
        
        if (type !== 'sell' && type !== 'buy') {
            return NextResponse.json({ error: "Invalid 'type' specified. Must be 'sell' or 'buy'." }, { status: 400 });
        }

        const { data: listingData, error } = await supabase
            .from('listings')
            .insert([
                {
                    user_id: user.id,
                    type,
                    commodity,
                    quantity,
                    price,
                    status: 'active',
                },
            ])
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error.message);
            return NextResponse.json({ error: 'Failed to create listing.', details: error.message }, { status: 500 });
        }

        return NextResponse.json(listingData, { status: 201 });

    } catch (e: any) {
        console.error('API Route Error:', e);
        return NextResponse.json({ error: 'An unexpected error occurred.', details: e.message }, { status: 500 });
    }
}
