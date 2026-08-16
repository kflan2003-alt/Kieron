// Run with: node tools/barcode-test.mjs
// Fixture tests for the Open Food Facts parser. The live API is unreachable
// from this machine, so these cover the response shapes it's documented to
// return plus the messy ones that matter: missing nutrition, kJ instead of
// kcal, multipack quantities, junk.
import { parseQuantity, parseProduct, normaliseBarcode, lookupBarcode, LookupError }
  from '../js/barcode.js';

let pass = 0, fail = 0;
const eq = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++; else { fail++; console.log(`  FAIL ${label}\n    got  ${JSON.stringify(got)}\n    want ${JSON.stringify(want)}`); }
};

console.log('parseQuantity');
eq('1kg', parseQuantity('1kg'), { qty: 1000, unit: 'g' });
eq('500 g', parseQuantity('500 g'), { qty: 500, unit: 'g' });
eq('1,5 kg (comma decimal)', parseQuantity('1,5 kg'), { qty: 1500, unit: 'g' });
eq('4 x 125g multipack', parseQuantity('4 x 125g'), { qty: 500, unit: 'g' });
eq('6 × 45 g unicode ×', parseQuantity('6 × 45 g'), { qty: 270, unit: 'g' });
eq('75cl', parseQuantity('75cl'), { qty: 750, unit: 'ml' });
eq('2L', parseQuantity('2L'), { qty: 2000, unit: 'ml' });
eq('410g e', parseQuantity('410g e'), { qty: 410, unit: 'g' });
eq('no quantity', parseQuantity('Pack of 6'), null);
eq('empty', parseQuantity(''), null);
eq('null', parseQuantity(null), null);
eq('zero rejected', parseQuantity('0g'), null);

console.log('normaliseBarcode');
eq('ean13', normaliseBarcode('5000157024671'), '5000157024671');
eq('spaces stripped', normaliseBarcode(' 5000 1570 24671 '), '5000157024671');
eq('too short', normaliseBarcode('123'), null);
eq('too long', normaliseBarcode('123456789012345'), null);
eq('letters only', normaliseBarcode('abcdefgh'), null);

console.log('parseProduct');
eq('full record', parseProduct({
  product_name: 'Greek Style Natural Yogurt',
  brands: 'Tesco',
  quantity: '1kg',
  nutriments: { proteins_100g: 9.2, 'energy-kcal_100g': 57 },
}), { name: 'Greek Style Natural Yogurt (Tesco)', packQty: 1000, unit: 'g', protein: 9.2, kcal: 57 });

eq('numeric product_quantity wins', parseProduct({
  product_name: 'Rice',
  quantity: 'about a bag',
  product_quantity: 2000, product_quantity_unit: 'g',
  nutriments: { proteins_100g: 7, 'energy-kcal_100g': 349 },
}), { name: 'Rice', packQty: 2000, unit: 'g', protein: 7, kcal: 349 });

eq('kJ converted to kcal', parseProduct({
  product_name: 'Oats', quantity: '500g',
  nutriments: { proteins_100g: 11, energy_100g: 1560 },
}), { name: 'Oats', packQty: 500, unit: 'g', protein: 11, kcal: 373 });

eq('string numbers coerced', parseProduct({
  product_name: 'Beans', quantity: '400g',
  nutriments: { proteins_100g: '4.7', 'energy-kcal_100g': '89' },
}), { name: 'Beans', packQty: 400, unit: 'g', protein: 4.7, kcal: 89 });

eq('missing nutrition -> nulls, not zeros', parseProduct({
  product_name: 'Mystery Item', quantity: '250g', nutriments: {},
}), { name: 'Mystery Item', packQty: 250, unit: 'g', protein: null, kcal: null });

eq('no nutriments key at all', parseProduct({
  product_name: 'Bare', quantity: '100g',
}), { name: 'Bare', packQty: 100, unit: 'g', protein: null, kcal: null });

eq('english name preferred', parseProduct({
  product_name: 'Poulet', product_name_en: 'Chicken', quantity: '1kg', nutriments: {},
}), { name: 'Chicken', packQty: 1000, unit: 'g', protein: null, kcal: null });

eq('brand equal to name not duplicated', parseProduct({
  product_name: 'Heinz', brands: 'Heinz', quantity: '415g', nutriments: {},
}), { name: 'Heinz', packQty: 415, unit: 'g', protein: null, kcal: null });

eq('first brand only', parseProduct({
  product_name: 'Milk', brands: 'Arla, Cravendale', quantity: '2L', nutriments: {},
}), { name: 'Milk (Arla)', packQty: 2000, unit: 'ml', protein: null, kcal: null });

eq('empty product', parseProduct({}), null);
eq('null product', parseProduct(null), null);
eq('string instead of object', parseProduct('nope'), null);
eq('negative protein ignored', parseProduct({
  product_name: 'Odd', quantity: '100g', nutriments: { proteins_100g: -5 },
}), { name: 'Odd', packQty: 100, unit: 'g', protein: null, kcal: null });

console.log('lookupBarcode (stubbed transport)');
const stub = (body, ok = true) => async () => ({ ok, json: async () => body });

const run = async (label, fetchImpl, expect) => {
  try {
    const got = await lookupBarcode('5000157024671', fetchImpl);
    eq(label, got, expect);
  } catch (e) {
    eq(label, { error: e.kind, isLookupError: e instanceof LookupError }, expect);
  }
};

await run('success', stub({ status: 1, product: {
  product_name: 'Chopped Tomatoes', brands: 'Napolina', quantity: '400g',
  nutriments: { proteins_100g: 1.3, 'energy-kcal_100g': 30 },
} }), { name: 'Chopped Tomatoes (Napolina)', packQty: 400, unit: 'g', protein: 1.3, kcal: 30, code: '5000157024671' });

await run('not found (status 0)', stub({ status: 0 }), { error: 'notfound', isLookupError: true });
await run('http error', stub({}, false), { error: 'blocked', isLookupError: true });
await run('network throws (CSP/offline)', async () => { throw new TypeError('Failed to fetch'); },
  { error: 'blocked', isLookupError: true });
await run('unparseable json', async () => ({ ok: true, json: async () => { throw new Error('bad'); } }),
  { error: 'unreadable', isLookupError: true });
await run('found but empty product', stub({ status: 1, product: {} }),
  { error: 'unreadable', isLookupError: true });

try {
  await lookupBarcode('12', stub({}));
  eq('bad barcode rejected before any request', 'no throw', 'throw');
} catch (e) {
  eq('bad barcode rejected before any request', e.kind, 'unreadable');
}

// The whole point: a lookup must never invent a price.
const priced = await lookupBarcode('5000157024671', stub({ status: 1, product: {
  product_name: 'X', quantity: '100g', nutriments: { proteins_100g: 1 },
} }));
eq('no price field ever returned', Object.keys(priced).includes('packPrice'), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
