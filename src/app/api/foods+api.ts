import { searchFoodsWithOAuth1 } from '@/services/fatsecret';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return Response.json([]);
    }

    const key = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID;
    const secret = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET;

    if (!key || !secret) {
      return Response.json({ error: 'Missing FatSecret credentials' }, { status: 400 });
    }

    const foods = await searchFoodsWithOAuth1(trimmed, key, secret);
    return Response.json(foods, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('[API /api/foods] Error:', err);
    return Response.json({ error: err?.message || 'Failed to search foods' }, { status: 500 });
  }
}

