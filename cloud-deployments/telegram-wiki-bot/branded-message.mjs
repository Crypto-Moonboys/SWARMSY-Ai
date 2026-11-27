import { addMoonboysMessageEmoji, telegramMessageLength } from './moonboys-media/faction-emoji.mjs';
import { composeTelegramMoonboy, loadHomepageMoonboyManifest } from './moonboys-media/moonboy-portrait.mjs';

const CAPTION_LIMIT = 1024;
const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Give the portrait fetch and composition a deadline even if a trait stalls.
export async function renderPortrait(env, seed) {
  const signal = AbortSignal.timeout(7000);
  try {
    const fetchAsset = (url, options) => fetch(url, { ...options, signal });
    const manifest = await loadHomepageMoonboyManifest(fetchAsset);
    return await composeTelegramMoonboy({ images: env.IMAGES, manifest, seed, fetchImpl: fetchAsset });
  } catch {
    console.warn('SWARMSY portrait unavailable');
    return null;
  }
}

function captionHtml(text, links) {
  const citations = links.length
    ? '\n\nWiki sources ' + links.map((url, i) => `<a href="${escapeHtml(url)}">[${i + 1}]</a>`).join(' ')
    : '';
  // Reserve room for pack emoji on up to four lines. Clip on a code point
  // boundary because Telegram measures its entities in UTF-16.
  const limit = CAPTION_LIMIT - telegramMessageLength(citations, 'HTML') - 64;
  let answer = text;
  if (answer.length > limit) {
    answer = answer.slice(0, limit - 1).replace(/[\uD800-\uDBFF]$/, '').trimEnd() + '…';
  }
  return escapeHtml(answer) + citations;
}

async function deliver(token, fields, content, portrait) {
  let body;
  const headers = {};
  if (portrait) {
    body = new FormData();
    for (const [key, value] of Object.entries({ ...fields, caption: content, parse_mode: 'HTML' })) {
      body.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    body.set('photo', new Blob([portrait.bytes], { type: 'image/jpeg' }), 'moonboy.jpg');
  } else {
    body = JSON.stringify({ ...fields, text: content, parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
    headers['Content-Type'] = 'application/json';
  }
  try {
    const method = portrait ? 'sendPhoto' : 'sendMessage';
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers, body, signal: AbortSignal.timeout(4000),
    });
    const data = await response.json();
    if (response.ok && data.ok && Number.isSafeInteger(data.result?.message_id)) {
      return { status: 'sent', emojiCount: (data.result.caption_entities ?? data.result.entities ?? [])
        .filter(entity => entity.type === 'custom_emoji').length };
    }
    if (data.ok === false && [400, 403, 413, 422].includes(response.status)) {
      return { status: 'rejected', badRequest: response.status === 400 };
    }
  } catch {
    // Delivery may have succeeded before a connection failure. Never retry it.
  }
  return { status: 'uncertain' };
}

export async function sendBrandedMessage(env, fields, { text, links = [] }, portrait) {
  const token = env.TELEGRAM_COMMUNITY_BOT_TOKEN;
  const html = captionHtml(text, links);
  const custom = await addMoonboysMessageEmoji(html, token);
  const basic = '🌙 ' + html;
  const caption = custom !== html && telegramMessageLength(custom, 'HTML') <= CAPTION_LIMIT ? custom : basic;
  let outcome = await deliver(token, fields, caption, portrait);
  let hasPhoto = Boolean(portrait);
  if (outcome.status === 'rejected' && outcome.badRequest && caption !== basic) {
    outcome = await deliver(token, fields, basic, portrait);
  }
  if (outcome.status === 'rejected' && portrait) {
    hasPhoto = false;
    outcome = await deliver(token, fields, basic, null);
  }
  console.log('SWARMSY delivery', JSON.stringify({ status: outcome.status, photo: hasPhoto, custom_emojis: outcome.emojiCount ?? 0 }));
  if (outcome.status !== 'sent') throw new Error('Telegram delivery ' + outcome.status);
}

export async function checkMedia(env) {
  const [portrait, branded] = await Promise.all([
    renderPortrait(env, 'setup:media:check'),
    addMoonboysMessageEmoji('Moonboys Wiki', env.TELEGRAM_COMMUNITY_BOT_TOKEN),
  ]);
  const customEmojiPack = branded.includes('<tg-emoji ');
  return Response.json({
    portrait: portrait ? { width: portrait.width, height: portrait.height, bytes: portrait.byteSize } : null,
    custom_emoji_pack: customEmojiPack,
  }, { status: portrait && customEmojiPack ? 200 : 503 });
}
