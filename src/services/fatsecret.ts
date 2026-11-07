import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = '@fatsecret_access_token';
const TOKEN_EXPIRY_KEY = '@fatsecret_token_expiry';

let inMemoryToken: string | null = null;
let inMemoryExpiry: number | null = null;

export interface ParsedFoodItem {
  id: string;
  name: string;
  brandName?: string;
  foodType: 'Brand' | 'Generic';
  servingSize: string;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  description: string;
}

/**
 * Standard RFC 3986 Percent-Encoding required for OAuth 1.0 signatures
 */
function rfc3986(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/**
 * Pure JavaScript HMAC-SHA1 algorithm (RFC 2104 / RFC 2045)
 * Runs synchronously across Hermes, iOS, Android, and Web without any external native dependencies.
 */
function hmacSha1(key: string, message: string): string {
  function utf8Encode(str: string): string {
    return unescape(encodeURIComponent(str));
  }

  function rawSha1(str: string): number[] {
    function safeAdd(x: number, y: number): number {
      const lsw = (x & 0xffff) + (y & 0xffff);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }

    function rol(num: number, cnt: number): number {
      return (num << cnt) | (num >>> (32 - cnt));
    }

    function ft(t: number, b: number, c: number, d: number): number {
      if (t < 20) return (b & c) | (~b & d);
      if (t < 40) return b ^ c ^ d;
      if (t < 60) return (b & c) | (b & d) | (c & d);
      return b ^ c ^ d;
    }

    function kt(t: number): number {
      return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514;
    }

    const x: number[] = [];
    for (let i = 0; i < str.length * 8; i += 8) {
      x[i >> 5] |= (str.charCodeAt(i / 8) & 0xff) << (24 - (i % 32));
    }
    x[str.length >> 2] |= 0x80 << (24 - ((str.length * 8) % 32));
    x[(((str.length + 8) >> 6) << 4) + 15] = str.length * 8;

    let a = 1732584193;
    let b = -271733879;
    let c = -1732584194;
    let d = 271733878;
    let e = -1009589776;
    const w = new Array(80);

    for (let i = 0; i < x.length; i += 16) {
      const olda = a;
      const oldb = b;
      const oldc = c;
      const oldd = d;
      const olde = e;

      for (let j = 0; j < 80; j++) {
        if (j < 16) w[j] = x[i + j] || 0;
        else w[j] = rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);

        const t = safeAdd(safeAdd(rol(a, 5), ft(j, b, c, d)), safeAdd(safeAdd(e, w[j]), kt(j)));
        e = d;
        d = c;
        c = rol(b, 30);
        b = a;
        a = t;
      }

      a = safeAdd(a, olda);
      b = safeAdd(b, oldb);
      c = safeAdd(c, oldc);
      d = safeAdd(d, oldd);
      e = safeAdd(e, olde);
    }

    return [a, b, c, d, e];
  }

  function toBase64(binStr: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let i = 0;
    while (i < binStr.length) {
      const chr1 = binStr.charCodeAt(i++);
      const chr2 = binStr.charCodeAt(i++);
      const chr3 = binStr.charCodeAt(i++);

      const enc1 = chr1 >> 2;
      const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      let enc4 = chr3 & 63;

      if (isNaN(chr2)) enc3 = enc4 = 64;
      else if (isNaN(chr3)) enc4 = 64;

      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    }
    return output;
  }

  const k = utf8Encode(key);
  const m = utf8Encode(message);
  const bkey: number[] = [];
  for (let i = 0; i < k.length; i++) bkey[i] = k.charCodeAt(i);

  if (bkey.length > 64) {
    const hash = rawSha1(k);
    bkey.length = 0;
    for (let i = 0; i < hash.length; i++) {
      bkey.push((hash[i] >> 24) & 0xff, (hash[i] >> 16) & 0xff, (hash[i] >> 8) & 0xff, hash[i] & 0xff);
    }
  }

  while (bkey.length < 64) bkey.push(0);

  let ipad = '';
  let opad = '';
  for (let i = 0; i < 64; i++) {
    ipad += String.fromCharCode(bkey[i] ^ 0x36);
    opad += String.fromCharCode(bkey[i] ^ 0x5c);
  }

  const innerHash = rawSha1(ipad + m);
  let innerStr = '';
  for (let i = 0; i < innerHash.length; i++) {
    innerStr += String.fromCharCode((innerHash[i] >> 24) & 0xff, (innerHash[i] >> 16) & 0xff, (innerHash[i] >> 8) & 0xff, innerHash[i] & 0xff);
  }

  const outerHash = rawSha1(opad + innerStr);
  let outerStr = '';
  for (let i = 0; i < outerHash.length; i++) {
    outerStr += String.fromCharCode((outerHash[i] >> 24) & 0xff, (outerHash[i] >> 16) & 0xff, (outerHash[i] >> 8) & 0xff, outerHash[i] & 0xff);
  }

  return toBase64(outerStr);
}

/**
 * Universal base64 encoder for React Native / Hermes / Web
 */
export function toBase64(input: string): string {
  if (typeof btoa === 'function') {
    try {
      return btoa(input);
    } catch {}
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input;
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) {
      throw new Error('toBase64 failed: The string contains characters outside of the Latin1 range.');
    }
    block = (block << 8) | charCode;
  }
  return output;
}

/**
 * Checks if FatSecret client credentials are configured in .env
 */
export function isFatSecretConfigured(): boolean {
  const clientId = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET;
  return !!(clientId && clientSecret && clientId.trim().length > 0 && clientSecret.trim().length > 0);
}

/**
 * Executes a search using FatSecret OAuth 1.0 (2-legged HMAC-SHA1).
 * Most free and standard FatSecret developer accounts provide OAuth 1.0 Consumer Key & Secret.
 */
export async function searchFoodsWithOAuth1(query: string, consumerKey: string, consumerSecret: string): Promise<ParsedFoodItem[]> {
  const url = 'https://platform.fatsecret.com/rest/server.api';
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const params: Record<string, string> = {
    format: 'json',
    max_results: '20',
    method: 'foods.search',
    oauth_consumer_key: consumerKey.trim(),
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
    search_expression: query.trim(),
  };

  const sortedKeys = Object.keys(params).sort();
  const normalizedParams = sortedKeys.map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`).join('&');
  const sigBaseString = ['GET', rfc3986(url), rfc3986(normalizedParams)].join('&');
  const sigKey = `${rfc3986(consumerSecret.trim())}&`;
  const signature = hmacSha1(sigKey, sigBaseString);

  params.oauth_signature = signature;

  const queryString = Object.keys(params)
    .map((k) => `${rfc3986(k)}=${rfc3986(params[k])}`)
    .join('&');

  const finalUrl = `${url}?${queryString}`;

  const response = await fetch(finalUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FatSecret OAuth1] Request failed:', response.status, errorText);
    throw new Error(`FatSecret OAuth 1.0 error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return parseFoodsSearchResponse(data);
}

/**
 * Requests an OAuth 2.0 access token from FatSecret or returns the cached active token.
 * Token is valid for 24 hours (86400 seconds). Automatically refreshes before expiration.
 * Doc: https://platform.fatsecret.com/docs/guides/authentication/oauth2
 */
export async function getFatSecretAccessToken(): Promise<string> {
  const clientId = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FATSECRET_MISSING_CREDENTIALS');
  }

  const now = Date.now();
  const EXPIRY_BUFFER_MS = 2 * 60 * 1000;

  // 1. Check in-memory token
  if (inMemoryToken && inMemoryExpiry && now < inMemoryExpiry - EXPIRY_BUFFER_MS) {
    return inMemoryToken;
  }

  // 2. Check AsyncStorage token
  try {
    const [cachedToken, cachedExpiryStr] = await Promise.all([
      AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      AsyncStorage.getItem(TOKEN_EXPIRY_KEY),
    ]);

    if (cachedToken && cachedExpiryStr) {
      const cachedExpiry = parseInt(cachedExpiryStr, 10);
      if (!isNaN(cachedExpiry) && now < cachedExpiry - EXPIRY_BUFFER_MS) {
        inMemoryToken = cachedToken;
        inMemoryExpiry = cachedExpiry;
        return cachedToken;
      }
    }
  } catch (err) {
    console.warn('[FatSecret] Error reading token cache:', err);
  }

  // 3. Request a fresh token from FatSecret OAuth 2.0 endpoint
  const credentials = toBase64(`${clientId.trim()}:${clientSecret.trim()}`);

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FatSecret Token Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const token = data.access_token;
  const expiresInSeconds = data.expires_in || 86400;
  const expiresAt = now + expiresInSeconds * 1000;

  inMemoryToken = token;
  inMemoryExpiry = expiresAt;

  try {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_STORAGE_KEY, token),
      AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString()),
    ]);
  } catch (err) {
    console.warn('[FatSecret] Error caching token:', err);
  }

  return token;
}

/**
 * Queries Open Food Facts public API (CORS-friendly, millions of products).
 * Used automatically on Web (where FatSecret REST API blocks CORS) and as a robust fallback.
 */
export async function searchOpenFoodFacts(query: string): Promise<ParsedFoodItem[]> {
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller ? controller.signal : undefined,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const products: any[] = Array.isArray(data?.products) ? data.products : [];

    const results: ParsedFoodItem[] = [];
    for (const item of products) {
      const name = item.product_name || item.product_name_en;
      if (!name || typeof name !== 'string' || name.trim().length === 0) continue;

      const nutriments = item.nutriments || {};
      const rawKcal = nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0;
      const calories = Math.round(Number(rawKcal) || 0);

      const rawP = nutriments.proteins_serving ?? nutriments.proteins_100g ?? nutriments.proteins ?? 0;
      const protein = Math.round((Number(rawP) || 0) * 10) / 10;

      const rawC = nutriments.carbohydrates_serving ?? nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0;
      const carbs = Math.round((Number(rawC) || 0) * 10) / 10;

      const rawF = nutriments.fat_serving ?? nutriments.fat_100g ?? nutriments.fat ?? 0;
      const fat = Math.round((Number(rawF) || 0) * 10) / 10;

      const servingSize = item.serving_size ? String(item.serving_size).trim() : '100g';
      const brand = item.brands ? String(item.brands).split(',')[0].trim() : undefined;

      results.push({
        id: String(item.code || item._id || Math.random().toString()),
        name: name.trim(),
        brandName: brand && brand.length > 0 ? brand : undefined,
        foodType: brand ? 'Brand' : 'Generic',
        servingSize: servingSize || '100g',
        calories,
        fat,
        carbs,
        protein,
        description: `Per ${servingSize} - Calories: ${calories}kcal | Fat: ${fat}g | Carbs: ${carbs}g | Protein: ${protein}g`,
      });

      if (results.length >= 6) break;
    }

    return results;
  } catch (e) {
    return [];
  }
}

/**
 * Searches the FatSecret food database for a given query (3+ characters).
 * - On Web: Uses Open Food Facts (with full CORS support) and instant local database,
 *   preventing browser CORS errors ('TypeError: Failed to fetch').
 * - On Native (iOS/Android): Uses FatSecret OAuth 1.0 & OAuth 2.0 directly via native HTTP,
 *   with graceful fallbacks.
 */
export async function searchFatSecretFoods(query: string): Promise<ParsedFoodItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  // On Web browsers: Direct requests to platform.fatsecret.com trigger browser CORS errors.
  // We first query our local server API route (/api/foods) which fetches server-side via Node.js
  if (Platform.OS === 'web') {
    try {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
      const response = await fetch(`${origin}/api/foods?query=${encodeURIComponent(trimmed)}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch (apiErr) {
      console.warn('[FoodDatabase Web] API route fetch failed, trying fallbacks:', apiErr);
    }

    try {
      const offResults = await searchOpenFoodFacts(trimmed);
      if (offResults.length > 0) {
        return offResults;
      }
    } catch (webErr) {
      console.warn('[FoodDatabase Web] OpenFoodFacts lookup fallback:', webErr);
    }
    return getMockFoodResults(trimmed);
  }

  const key = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_ID;
  const secret = process.env.EXPO_PUBLIC_FATSECRET_CLIENT_SECRET;

  if (!key || !secret || key.trim().length === 0 || secret.trim().length === 0) {
    console.warn('[FatSecret] Client ID or Secret missing in .env. Using fallback database.');
    return getMockFoodResults(trimmed);
  }

  // 1. On Native: Try OAuth 1.0 (2-legged HMAC-SHA1) - standard for FatSecret Developer Accounts
  try {
    const results = await searchFoodsWithOAuth1(trimmed, key, secret);
    return results;
  } catch (oauth1Error: any) {
    console.log('[FatSecret] OAuth 1.0 attempt failed, attempting OAuth 2.0...', oauth1Error?.message);

    // 2. If OAuth 1.0 failed, attempt OAuth 2.0 flow
    try {
      let token = await getFatSecretAccessToken();

      const params = new URLSearchParams({
        method: 'foods.search',
        search_expression: trimmed,
        max_results: '5',
        format: 'json',
      });

      let response = await fetch('https://platform.fatsecret.com/rest/server.api', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: params.toString(),
      });

      if (response.status === 401) {
        inMemoryToken = null;
        inMemoryExpiry = null;
        await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY]);
        token = await getFatSecretAccessToken();

        response = await fetch('https://platform.fatsecret.com/rest/server.api', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: params.toString(),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FatSecret search failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return parseFoodsSearchResponse(data);
    } catch (oauth2Error) {
      console.warn('[FatSecret] Native OAuth attempts failed, falling back to open database:', oauth2Error);
      try {
        const offResults = await searchOpenFoodFacts(trimmed);
        if (offResults.length > 0) return offResults;
      } catch {}
      return getMockFoodResults(trimmed);
    }
  }
}

/**
 * Parses raw JSON returned by FatSecret foods.search API.
 * Handles both single-object and array responses, plus regex parsing of nutrition strings.
 */
export function parseFoodsSearchResponse(data: any): ParsedFoodItem[] {
  if (data?.error) {
    throw new Error(data.error.message || `FatSecret API Error code: ${data.error.code}`);
  }

  const rawFood = data?.foods?.food;
  if (!rawFood) return [];

  // FatSecret returns a single object if 1 item matches, or an array if multiple match
  const foodArray: any[] = Array.isArray(rawFood) ? rawFood : [rawFood];

  return foodArray.slice(0, 20).map((item: any) => {
    const desc = item.food_description || '';

    // Example description: "Per 1 serving - Calories: 300kcal | Fat: 13.00g | Carbs: 32.00g | Protein: 15.00g"
    let servingSize = '1 serving';
    const splitIndex = desc.indexOf('- Calories:');
    if (splitIndex !== -1) {
      servingSize = desc.substring(0, splitIndex).replace(/^Per\s+/i, '').trim();
    } else {
      const perMatch = desc.match(/^Per\s+([^|-]+)/i);
      if (perMatch) servingSize = perMatch[1].trim();
    }

    const calMatch = desc.match(/Calories:\s*([0-9.]+)\s*kcal/i);
    const calories = calMatch ? Math.round(parseFloat(calMatch[1])) : 0;

    const fatMatch = desc.match(/Fat:\s*([0-9.]+)\s*g/i);
    const fat = fatMatch ? parseFloat(fatMatch[1]) : 0;

    const carbsMatch = desc.match(/Carbs:\s*([0-9.]+)\s*g/i);
    const carbs = carbsMatch ? parseFloat(carbsMatch[1]) : 0;

    const proteinMatch = desc.match(/Protein:\s*([0-9.]+)\s*g/i);
    const protein = proteinMatch ? parseFloat(proteinMatch[1]) : 0;

    return {
      id: String(item.food_id || Math.random().toString()),
      name: item.food_name || 'Food Item',
      brandName: item.brand_name || undefined,
      foodType: (item.food_type as 'Brand' | 'Generic') || 'Generic',
      servingSize: servingSize || '1 serving',
      calories,
      fat,
      carbs,
      protein,
      description: desc,
    };
  });
}

/**
 * Fallback mock database when credentials are not yet configured in .env
 */
function getMockFoodResults(query: string): ParsedFoodItem[] {
  const normalized = query.toLowerCase();
  const mockDatabase: ParsedFoodItem[] = [
    {
      id: '101',
      name: 'Chicken Breast (Grilled)',
      brandName: 'Fresh Farms',
      foodType: 'Generic',
      servingSize: '100g (3.5 oz)',
      calories: 165,
      fat: 3.6,
      carbs: 0,
      protein: 31,
      description: 'Per 100g - Calories: 165kcal | Fat: 3.60g | Carbs: 0.00g | Protein: 31.00g',
    },
    {
      id: '102',
      name: 'Egg (Whole, Raw)',
      foodType: 'Generic',
      servingSize: '1 large (50g)',
      calories: 72,
      fat: 4.8,
      carbs: 0.4,
      protein: 6.3,
      description: 'Per 1 large - Calories: 72kcal | Fat: 4.80g | Carbs: 0.40g | Protein: 6.30g',
    },
    {
      id: '102b',
      name: 'Boiled Egg (Hard-boiled)',
      foodType: 'Generic',
      servingSize: '1 large (50g)',
      calories: 78,
      fat: 5.3,
      carbs: 0.6,
      protein: 6.3,
      description: 'Per 1 large - Calories: 78kcal | Fat: 5.30g | Carbs: 0.60g | Protein: 6.30g',
    },
    {
      id: '102c',
      name: 'Fried Egg',
      foodType: 'Generic',
      servingSize: '1 large (46g)',
      calories: 90,
      fat: 6.8,
      carbs: 0.4,
      protein: 6.3,
      description: 'Per 1 large - Calories: 90kcal | Fat: 6.80g | Carbs: 0.40g | Protein: 6.30g',
    },
    {
      id: '102d',
      name: 'Scrambled Eggs',
      foodType: 'Generic',
      servingSize: '2 large eggs (100g)',
      calories: 148,
      fat: 10.0,
      carbs: 1.6,
      protein: 12.0,
      description: 'Per 100g - Calories: 148kcal | Fat: 10.00g | Carbs: 1.60g | Protein: 12.00g',
    },
    {
      id: '102e',
      name: 'Poached Egg',
      foodType: 'Generic',
      servingSize: '1 large (50g)',
      calories: 72,
      fat: 4.7,
      carbs: 0.4,
      protein: 6.3,
      description: 'Per 1 large - Calories: 72kcal | Fat: 4.70g | Carbs: 0.40g | Protein: 6.30g',
    },
    {
      id: '102f',
      name: 'Egg Whites (Liquid or Cooked)',
      foodType: 'Generic',
      servingSize: '1 cup (243g)',
      calories: 126,
      fat: 0.4,
      carbs: 1.8,
      protein: 26.5,
      description: 'Per 1 cup - Calories: 126kcal | Fat: 0.40g | Carbs: 1.80g | Protein: 26.50g',
    },
    {
      id: '102g',
      name: 'Egg Yolk',
      foodType: 'Generic',
      servingSize: '1 large (17g)',
      calories: 55,
      fat: 4.5,
      carbs: 0.6,
      protein: 2.7,
      description: 'Per 1 large - Calories: 55kcal | Fat: 4.50g | Carbs: 0.60g | Protein: 2.70g',
    },
    {
      id: '102h',
      name: 'Egg Omelet (Plain)',
      foodType: 'Generic',
      servingSize: '1 omelet (120g)',
      calories: 184,
      fat: 14.4,
      carbs: 0.8,
      protein: 12.8,
      description: 'Per 1 omelet - Calories: 184kcal | Fat: 14.40g | Carbs: 0.80g | Protein: 12.80g',
    },
    {
      id: '102i',
      name: 'Large White Eggs',
      brandName: 'Great Value',
      foodType: 'Brand',
      servingSize: '1 egg (50g)',
      calories: 70,
      fat: 5.0,
      carbs: 0.0,
      protein: 6.0,
      description: 'Per 1 egg - Calories: 70kcal | Fat: 5.00g | Carbs: 0.00g | Protein: 6.00g',
    },
    {
      id: '103',
      name: 'Oatmeal (Rolled Oats)',
      brandName: 'Quaker',
      foodType: 'Brand',
      servingSize: '1 cup cooked (234g)',
      calories: 158,
      fat: 3.2,
      carbs: 27.4,
      protein: 5.9,
      description: 'Per 1 cup - Calories: 158kcal | Fat: 3.20g | Carbs: 27.40g | Protein: 5.90g',
    },
    {
      id: '104',
      name: 'Banana (Raw)',
      foodType: 'Generic',
      servingSize: '1 medium (118g)',
      calories: 105,
      fat: 0.4,
      carbs: 27,
      protein: 1.3,
      description: 'Per 1 medium - Calories: 105kcal | Fat: 0.40g | Carbs: 27.00g | Protein: 1.30g',
    },
    {
      id: '105',
      name: 'White Rice (Cooked)',
      foodType: 'Generic',
      servingSize: '1 cup (158g)',
      calories: 206,
      fat: 0.4,
      carbs: 45,
      protein: 4.3,
      description: 'Per 1 cup - Calories: 206kcal | Fat: 0.40g | Carbs: 45.00g | Protein: 4.30g',
    },
    {
      id: '106',
      name: 'Avocado',
      foodType: 'Generic',
      servingSize: '1/2 medium (100g)',
      calories: 160,
      fat: 14.7,
      carbs: 8.5,
      protein: 2.0,
      description: 'Per 100g - Calories: 160kcal | Fat: 14.70g | Carbs: 8.50g | Protein: 2.00g',
    },
    {
      id: '107',
      name: 'Greek Yogurt (Plain, Nonfat)',
      brandName: 'Chobani',
      foodType: 'Brand',
      servingSize: '1 container (170g)',
      calories: 100,
      fat: 0,
      carbs: 6,
      protein: 18,
      description: 'Per 170g - Calories: 100kcal | Fat: 0.00g | Carbs: 6.00g | Protein: 18.00g',
    },
    {
      id: '108',
      name: 'Peanut Butter',
      brandName: 'Skippy',
      foodType: 'Brand',
      servingSize: '2 tbsp (32g)',
      calories: 190,
      fat: 16,
      carbs: 7,
      protein: 7,
      description: 'Per 2 tbsp - Calories: 190kcal | Fat: 16.00g | Carbs: 7.00g | Protein: 7.00g',
    },
    {
      id: '109',
      name: 'Salmon (Baked / Grilled)',
      foodType: 'Generic',
      servingSize: '1 fillet (154g)',
      calories: 280,
      fat: 12.5,
      carbs: 0,
      protein: 39.3,
      description: 'Per 1 fillet - Calories: 280kcal | Fat: 12.50g | Carbs: 0.00g | Protein: 39.30g',
    },
    {
      id: '110',
      name: 'Almonds (Raw)',
      foodType: 'Generic',
      servingSize: '1 oz (28g / 23 almonds)',
      calories: 164,
      fat: 14.2,
      carbs: 6.1,
      protein: 6.0,
      description: 'Per 1 oz - Calories: 164kcal | Fat: 14.20g | Carbs: 6.10g | Protein: 6.00g',
    },
    {
      id: '111',
      name: 'Apple (Raw, with skin)',
      foodType: 'Generic',
      servingSize: '1 medium (182g)',
      calories: 95,
      fat: 0.3,
      carbs: 25,
      protein: 0.5,
      description: 'Per 1 medium - Calories: 95kcal | Fat: 0.30g | Carbs: 25.00g | Protein: 0.50g',
    },
    {
      id: '112',
      name: 'Whole Milk',
      brandName: 'Dairy Fresh',
      foodType: 'Generic',
      servingSize: '1 cup (244g)',
      calories: 149,
      fat: 8.0,
      carbs: 12,
      protein: 7.7,
      description: 'Per 1 cup - Calories: 149kcal | Fat: 8.00g | Carbs: 12.00g | Protein: 7.70g',
    },
    {
      id: '113',
      name: 'Whole Wheat Bread',
      foodType: 'Generic',
      servingSize: '1 slice (32g)',
      calories: 81,
      fat: 1.1,
      carbs: 13.8,
      protein: 4.0,
      description: 'Per 1 slice - Calories: 81kcal | Fat: 1.10g | Carbs: 13.80g | Protein: 4.00g',
    },
    {
      id: '114',
      name: 'Pasta (Cooked)',
      foodType: 'Generic',
      servingSize: '1 cup (140g)',
      calories: 220,
      fat: 1.3,
      carbs: 43,
      protein: 8.1,
      description: 'Per 1 cup - Calories: 220kcal | Fat: 1.30g | Carbs: 43.00g | Protein: 8.10g',
    },
    {
      id: '115',
      name: 'Pizza (Cheese)',
      foodType: 'Generic',
      servingSize: '1 slice (107g)',
      calories: 285,
      fat: 10.4,
      carbs: 35.7,
      protein: 12.2,
      description: 'Per 1 slice - Calories: 285kcal | Fat: 10.40g | Carbs: 35.70g | Protein: 12.20g',
    },
    {
      id: '116',
      name: 'Cheeseburger',
      foodType: 'Generic',
      servingSize: '1 sandwich (150g)',
      calories: 420,
      fat: 21,
      carbs: 38,
      protein: 23,
      description: 'Per 1 burger - Calories: 420kcal | Fat: 21.00g | Carbs: 38.00g | Protein: 23.00g',
    },
    {
      id: '117',
      name: 'Broccoli (Steamed)',
      foodType: 'Generic',
      servingSize: '1 cup chopped (156g)',
      calories: 55,
      fat: 0.6,
      carbs: 11.2,
      protein: 3.7,
      description: 'Per 1 cup - Calories: 55kcal | Fat: 0.60g | Carbs: 11.20g | Protein: 3.70g',
    },
    {
      id: '118',
      name: 'Sirloin Steak (Grilled)',
      foodType: 'Generic',
      servingSize: '1 steak (180g)',
      calories: 380,
      fat: 18.0,
      carbs: 0,
      protein: 52.0,
      description: 'Per 1 steak - Calories: 380kcal | Fat: 18.00g | Carbs: 0.00g | Protein: 52.00g',
    },
    {
      id: '119',
      name: 'Whey Protein Shake',
      brandName: 'Optimum Nutrition',
      foodType: 'Brand',
      servingSize: '1 scoop (30g in water)',
      calories: 120,
      fat: 1.5,
      carbs: 3.0,
      protein: 24.0,
      description: 'Per 1 scoop - Calories: 120kcal | Fat: 1.50g | Carbs: 3.00g | Protein: 24.00g',
    },
    {
      id: '120',
      name: 'Tuna (Canned in Water)',
      foodType: 'Generic',
      servingSize: '1 can drained (165g)',
      calories: 142,
      fat: 1.4,
      carbs: 0,
      protein: 32.5,
      description: 'Per 1 can - Calories: 142kcal | Fat: 1.40g | Carbs: 0.00g | Protein: 32.50g',
    },
  ];

  const filtered = mockDatabase.filter(
    (item) => item.name.toLowerCase().includes(normalized) || (item.brandName && item.brandName.toLowerCase().includes(normalized))
  );

  return filtered.slice(0, 20);
}
