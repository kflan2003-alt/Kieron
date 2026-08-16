// Barcode lookup against Open Food Facts — a free, open, no-key database of
// packaged food. It gives the product name, pack size and nutrition. It does
// NOT give prices: no public database has UK shop prices, so the price is
// always yours to type.
//
// A caution worth keeping in the code: this parser was written without being
// able to call the live API (the machine it was built on couldn't reach it), so
// every field is read defensively — several possible key names, types checked,
// anything unreadable left null for you to fill rather than guessed at. If the
// response shape ever changes, this degrades to "couldn't read that" instead of
// writing nonsense into your price list.

const API = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = [
  'code', 'product_name', 'product_name_en', 'generic_name', 'brands',
  'quantity', 'product_quantity', 'product_quantity_unit', 'nutriments',
].join(',');

const TIMEOUT_MS = 10000;

export class LookupError extends Error {
  constructor(message, kind) {
    super(message);
    this.kind = kind; // 'offline' | 'blocked' | 'notfound' | 'unreadable'
  }
}

// Live camera scanning needs the browser's own barcode reader. Chrome and
// Android have it; Safari doesn't, and there it falls back to typing the digits.
export function canScanWithCamera() {
  return typeof window !== 'undefined'
    && 'BarcodeDetector' in window
    && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    && window.isSecureContext;
}

// "1kg" -> 1000g. "6 x 45g" -> 270g. "75cl" -> 750ml. Null when there's no
// quantity to be found, which is common on loose or badly-catalogued products.
export function parseQuantity(text) {
  if (!text) return null;
  const s = String(text).toLowerCase().replace(/,/g, '.');

  const toBase = (value, unit) => {
    if (!Number.isFinite(value) || value <= 0) return null;
    switch (unit) {
      case 'kg': return { qty: value * 1000, unit: 'g' };
      case 'g': return { qty: value, unit: 'g' };
      case 'l': return { qty: value * 1000, unit: 'ml' };
      case 'cl': return { qty: value * 10, unit: 'ml' };
      case 'ml': return { qty: value, unit: 'ml' };
      default: return null;
    }
  };

  // Multipacks first — "4 x 125g" is 500g, not 4g and not 125g.
  const multi = s.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/);
  if (multi) {
    const base = toBase(Number(multi[2]), multi[3]);
    if (base) return { qty: base.qty * Number(multi[1]), unit: base.unit };
  }

  const single = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|cl|l)\b/);
  if (single) return toBase(Number(single[1]), single[2]);

  return null;
}

function firstNumber(source, keys) {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const value = source[key];
    const n = typeof value === 'string' ? Number(value) : value;
    if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function firstString(source, keys) {
  if (!source || typeof source !== 'object') return '';
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

// Turns whatever the API returned into the fields the price editor needs.
// Anything it can't read confidently comes back null.
export function parseProduct(product) {
  if (!product || typeof product !== 'object') return null;

  const name = firstString(product, ['product_name_en', 'product_name', 'generic_name']);
  const brand = firstString(product, ['brands']).split(',')[0].trim();
  const n = product.nutriments;

  const protein = firstNumber(n, ['proteins_100g', 'proteins_value', 'proteins']);

  let kcal = firstNumber(n, ['energy-kcal_100g', 'energy-kcal_value', 'energy-kcal']);
  if (kcal == null) {
    // Some products carry only kilojoules.
    const kj = firstNumber(n, ['energy_100g', 'energy-kj_100g', 'energy_value']);
    if (kj != null) kcal = kj / 4.184;
  }

  // Prefer the numeric quantity when the API gives one, fall back to parsing
  // the human-written "quantity" string.
  let pack = null;
  const numericQty = firstNumber(product, ['product_quantity']);
  const numericUnit = firstString(product, ['product_quantity_unit']).toLowerCase();
  if (numericQty != null && numericQty > 0) {
    const converted = parseQuantity(`${numericQty}${numericUnit || 'g'}`);
    if (converted) pack = converted;
  }
  if (!pack) pack = parseQuantity(product.quantity);

  const label = [name, brand && brand !== name ? `(${brand})` : ''].filter(Boolean).join(' ');
  if (!label && protein == null && !pack) return null;

  return {
    name: label || '',
    packQty: pack ? Math.round(pack.qty) : null,
    unit: pack ? pack.unit : null,
    protein: protein == null ? null : Math.round(protein * 10) / 10,
    kcal: kcal == null ? null : Math.round(kcal),
  };
}

// Barcodes are 8–14 digits; anything else is a typo, not a lookup.
export function normaliseBarcode(input) {
  const digits = String(input || '').replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 14 ? digits : null;
}

export async function lookupBarcode(input, fetchImpl = fetch) {
  const code = normaliseBarcode(input);
  if (!code) throw new LookupError('That does not look like a barcode — they are 8 to 14 digits.', 'unreadable');

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new LookupError('No connection, so the food database is out of reach. Type the details in instead.', 'offline');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), TIMEOUT_MS) : null;

  let response;
  try {
    response = await fetchImpl(`${API}/${code}.json?fields=${FIELDS}`, {
      signal: controller ? controller.signal : undefined,
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    throw new LookupError(
      'Could not reach the food database. Barcode lookup needs a connection, and it does not work inside Claude — outside requests are blocked there.',
      'blocked'
    );
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!response || !response.ok) {
    throw new LookupError('The food database did not answer. Try again, or type the details in.', 'blocked');
  }

  let body;
  try {
    body = await response.json();
  } catch (e) {
    throw new LookupError('The food database sent something unreadable.', 'unreadable');
  }

  const found = body && (body.status === 1 || body.status === 'success' || body.product);
  if (!found) {
    throw new LookupError('No product with that barcode. Type the details in yourself.', 'notfound');
  }

  const parsed = parseProduct(body.product);
  if (!parsed) {
    throw new LookupError('That product is in the database but has nothing useful recorded.', 'unreadable');
  }

  return { ...parsed, code };
}
