// Telegram Moonboy portrait PR1: an unused, opt-in composition foundation.
// Cloudflare Workers Images binding is required by the caller (not provisioned
// by this PR). No Telegram request, D1 write, signer or scheduled task here.
// The homepage's data/avatar-builder-manifest.json is the ONLY trait catalogue.

export const PORTRAIT_LAYER_ORDER = Object.freeze([
  'background', 'body', 'tattoos', 'clothes', 'chains', 'face',
  'hat', 'left-arm', 'right-arm'
]);
export const PORTRAIT_MANIFEST_URL =
  'https://cryptomoonboys.com/data/avatar-builder-manifest.json';
export const PORTRAIT_ASSET_ORIGIN = 'https://cryptomoonboys.com';
// Telegram displays these inside a chat card rather than as full-screen
// builder exports. Keep the 1000px source layers untouched, but flatten a
// smaller delivery-only derivative to cut Images output, cache and upload
// bytes without changing the website builder.
export const PORTRAIT_SIZE = 512;
export const PORTRAIT_MAX_BYTES = 250_000;
const MAX_MANIFEST_BYTES = 600_000;
const MAX_LAYER_BYTES = 850_000;
const MAX_TRAITS = 2_000;
const SEED_PATTERN = /^[A-Za-z0-9_.:|/-]{1,200}$/;
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const decoder = new TextDecoder('utf-8', { fatal: true });

// Curated female-only variants from the supplied TRAITS.txt. IDs use the
// authoritative homepage manifest naming convention; no image assets copied.
// Face and hat pools are exclusive by avatar type. Female portraits may use
// either shared/male or female-specific clothes and arms; male portraits may
// not use the explicitly female-only clothes or arm variants.
export const TELEGRAM_FEMALE_ONLY_TRAITS = Object.freeze({
  'clothes': Object.freeze([2, 3, 12, 14, 44, 45, 46, 54, 64, 65, 66, 67, 68, 85, 92, 93, 109, 110].map(n => 'clothes-mc-clothes-' + n)),
  'face': Object.freeze([13, 20, 21, 39, 40, 41, 109, 110, 111, 115, 116, 148].map(n => 'face-mb-face-' + n)),
  'hat': Object.freeze([2, 8, 9, 56, 58, 62, 81, 82, 83, 84, 86, 116, 117, 118, 135, 175, 178, 182, 186, 187, 188, 189, 199, 204, 213, 216, 217, 218, 219, 221, 224, 227].map(n => 'hat-mb-hat-' + n)),
  'left-arm': Object.freeze([14].map(n => 'left-arm-mb-left-' + n)),
  'right-arm': Object.freeze([60, 67, 68, 75].map(n => 'right-arm-mb-right-' + n)),
});
const FEMALE_ONLY_IDS = new Map(Object.entries(TELEGRAM_FEMALE_ONLY_TRAITS)
  .map(([category, ids]) => [category, new Set(ids)]));

function avatarPool(entries, category, avatarType) {
  const femaleOnly = FEMALE_ONLY_IDS.get(category);
  if (!femaleOnly) return entries;
  if (avatarType === 'female') {
    // Male faces/hats never appear in the female branch.
    if (category === 'face' || category === 'hat') {
      return entries.filter(entry => femaleOnly.has(entry.id));
    }
    return entries;
  }
  // Male portraits exclude all explicitly female-only variants.
  return entries.filter(entry => !femaleOnly.has(entry.id));
}


const fail = reason => { throw new Error('telegram_moonboy_' + reason); };

// Read response streams with a hard cap, even if Content-Length is absent or
// untrusted. Never buffer an arbitrarily large manifest, layer or JPEG.
async function boundedBytes(response, limit, label) {
  if (!response || response.ok !== true || !response.body?.getReader) {
    fail(label + '_unavailable');
  }
  const declared = response.headers?.get?.('content-length');
  if (declared && (!/^[0-9]+$/.test(declared) || Number(declared) > limit)) {
    fail(label + '_oversize');
  }
  const reader = response.body.getReader();
  const pieces = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!(value instanceof Uint8Array)) fail(label + '_invalid_stream');
      total += value.byteLength;
      if (total > limit) fail(label + '_oversize');
      pieces.push(value);
    }
  } catch (error) {
    try { await reader.cancel(); } catch { /* ignore cleanup error */ }
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (!total) fail(label + '_empty');
  const data = new Uint8Array(total);
  let offset = 0;
  for (const piece of pieces) { data.set(piece, offset); offset += piece.length; }
  return data;
}

function validateManifest(manifest) {
  if (!manifest || manifest.version !== 1 || manifest.layerSize !== 1000 ||
      !Array.isArray(manifest.categoryOrder) ||
      manifest.categoryOrder.length !== PORTRAIT_LAYER_ORDER.length ||
      !PORTRAIT_LAYER_ORDER.every((id, index) => manifest.categoryOrder[index] === id) ||
      !Array.isArray(manifest.categories) ||
      manifest.categories.length !== PORTRAIT_LAYER_ORDER.length ||
      !Array.isArray(manifest.traits) ||
      manifest.traits.length < 9 || manifest.traits.length > MAX_TRAITS) {
    fail('invalid_builder_manifest');
  }
  for (let index = 0; index < PORTRAIT_LAYER_ORDER.length; index++) {
    const category = manifest.categories[index];
    if (category?.id !== PORTRAIT_LAYER_ORDER[index] ||
        category.order !== index) fail('invalid_builder_categories');
  }
  const entries = new Map(PORTRAIT_LAYER_ORDER.map(id => [id, []]));
  const seen = new Set();
  for (const trait of manifest.traits) {
    const category = trait?.category;
    if (!entries.has(category) || typeof trait.id !== 'string' ||
        !ID_PATTERN.test(trait.id) || seen.has(trait.id)) {
      fail('invalid_builder_trait');
    }
    seen.add(trait.id);
    // Browser canvas-only backgrounds have no still layer URL. PR1 must
    // neither fetch their thumbnail nor claim an equivalent animated frame.
    if (trait.kind === 'animated') {
      if (category !== 'background' || trait.layer !== undefined) {
        fail('invalid_animated_trait');
      }
      continue;
    }
    if (trait.kind !== undefined && trait.kind !== 'static') fail('invalid_builder_trait');
    const expected = '/img/avatar-builder/layers/' +
      category + '/' + trait.id + '.webp';
    if (trait.layer !== expected) fail('unsafe_builder_asset_path');
    entries.get(category).push({ id: trait.id, category, path: expected });
  }
  for (const category of PORTRAIT_LAYER_ORDER) {
    if (!entries.get(category)?.length) fail('missing_builder_category_' + category);
  }
  return entries;
}

// A stable logical-message seed makes retries reproducible. Select avatar type
// first with a dedicated SHA-256 bit (balanced 50/50 independent of pool sizes),
// then independently select every category from its eligible catalogue.
export async function chooseTelegramMoonboyTraits(manifest, seed, cryptoImpl = globalThis.crypto) {
  if (typeof seed !== 'string' || !SEED_PATTERN.test(seed)) fail('invalid_seed');
  if (!cryptoImpl?.subtle?.digest) fail('crypto_unavailable');
  const choices = validateManifest(manifest);
  const genderData = new TextEncoder().encode('telegram-moonboy:v2|avatar-type|' + seed);
  const genderDigest = new Uint8Array(await cryptoImpl.subtle.digest('SHA-256', genderData));
  const avatarType = (genderDigest[0] & 1) === 0 ? 'female' : 'male';
  const layers = [];
  for (const category of PORTRAIT_LAYER_ORDER) {
    const data = new TextEncoder().encode(
      'telegram-moonboy:v2|' + manifest.version + '|' + avatarType + '|' + category + '|' + seed
    );
    const hash = new Uint8Array(await cryptoImpl.subtle.digest('SHA-256', data));
    const number = new DataView(hash.buffer, hash.byteOffset, hash.byteLength)
      .getUint32(0, false);
    const pool = avatarPool(choices.get(category), category, avatarType);
    if (!pool.length) fail('missing_' + avatarType + '_category_' + category);
    const picked = pool[number % pool.length];
    layers.push(Object.freeze({ ...picked }));
  }
  return Object.freeze({
    manifestVersion: manifest.version,
    avatarType,
    size: PORTRAIT_SIZE,
    layers: Object.freeze(layers)
  });
}

export async function loadHomepageMoonboyManifest(fetchImpl = fetch) {
  const response = await fetchImpl(PORTRAIT_MANIFEST_URL, {
    // Cloudflare Workers does not implement redirect:"error". Manual mode
    // preserves the same fail-closed policy because boundedBytes rejects every
    // non-2xx response, including 3xx redirects, without following Location.
    method: 'GET', redirect: 'manual',
    headers: { Accept: 'application/json' }
  });
  const bytes = await boundedBytes(response, MAX_MANIFEST_BYTES, 'manifest');
  let parsed;
  try { parsed = JSON.parse(decoder.decode(bytes)); }
  catch { fail('manifest_invalid_json'); }
  validateManifest(parsed);
  return parsed;
}

function blobStream(bytes) {
  return new Blob([bytes], { type: 'image/webp' }).stream();
}

// Runtime rendering via the Cloudflare Images binding; no native Sharp,
// browser canvas, Pages image generator or change to Telegram transports.
// Source URLs are constructed solely from validated builder paths.
export async function composeTelegramMoonboy({
  images, manifest, seed, fetchImpl = fetch, cryptoImpl = globalThis.crypto
} = {}) {
  if (!images?.input) fail('images_binding_unavailable');
  const plan = await chooseTelegramMoonboyTraits(manifest, seed, cryptoImpl);
  const layers = await Promise.all(plan.layers.map(async layer => {
    const response = await fetchImpl(PORTRAIT_ASSET_ORIGIN + layer.path, {
      method: 'GET', redirect: 'manual',
      headers: { Accept: 'image/webp' }
    });
    // An HTTP failure is an unavailable layer, regardless of the error
    // response's MIME type (404 HTML/text is not a malformed WebP).
    if (!response?.ok) fail('layer_unavailable');
    const contentType = response.headers?.get?.('content-type') || '';
    if (!/^image\/webp(?:;|$)/i.test(contentType)) fail('invalid_layer_format');
    return boundedBytes(response, MAX_LAYER_BYTES, 'layer');
  }));
  // Cloudflare Images allows at most ten transforms in one pipeline. All
  // homepage layers are already the same 1000x1000 size, so composite the
  // eight overlays first, then resize the completed square once: nine total
  // operations instead of resizing every input separately (seventeen).
  // Retry at progressively smaller JPEG quality only if output > 250 KB.
  for (const quality of [72, 60, 48]) {
    let transform = images.input(blobStream(layers[0]));
    for (let i = 1; i < layers.length; i++) {
      transform = transform.draw(
        images.input(blobStream(layers[i])),
        { left: 0, top: 0, composite: 'over' }
      );
    }
    transform = transform.transform({
      width: PORTRAIT_SIZE, height: PORTRAIT_SIZE, fit: 'squeeze'
    });
    const output = await transform.output({ format: 'image/jpeg', quality });
    const response = output.response();
    if (!/^image\/jpeg(?:;|$)/i.test(response.headers?.get?.('content-type') || '')) {
      fail('invalid_output_format');
    }
    const imageBytes = await boundedBytes(response, 1_000_000, 'output');
    if (imageBytes.length <= PORTRAIT_MAX_BYTES) {
      return Object.freeze({
        bytes: imageBytes,
        mimeType: 'image/jpeg',
        width: PORTRAIT_SIZE,
        height: PORTRAIT_SIZE,
        byteSize: imageBytes.byteLength,
        selected: Object.freeze(plan.layers.map(l => l.id)),
        avatarType: plan.avatarType,
        manifestVersion: plan.manifestVersion
      });
    }
  }
  fail('output_exceeds_250kb');
}
