const PACK_NAME = 'GKMoonboys';
const FACTION_NAMES = [
  'All City Bulls', 'Crypto Moongirls', 'Crypto Stoned Boys', 'GraffPUNKS',
  'Hard Fork Rockers', 'Rugpull Miners', 'Blockchain Furies', 'The Blockstars', 'Nomad Bears',
];
// Daily-loop status uses canonical faction IDs as its labels.
const FACTION_LABELS = Object.freeze(Object.fromEntries(
  FACTION_NAMES.map(label => [
    label === 'The Blockstars' ? 'blockstars' : label.toLowerCase().replaceAll(' ', '-'),
    label,
  ]),
));
const FACTION_LINE = /^Faction: ([^\r\n]+)$/m;
export const isTelegramBotToken = token => /^[0-9]{4,20}:[A-Za-z0-9_-]{20,}$/.test(token);
const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const TELEGRAM_HTML_TAG = /<\/?(?:a|b|strong|i|em|u|ins|s|strike|del|span|tg-spoiler|tg-emoji|tg-time|code|pre|blockquote)(?:\s[^<>]*)?>/gi;

export function telegramMessageLength(text, parseMode) {
  if (parseMode !== 'HTML') return text.length;
  // Count rendered characters conservatively as UTF-16 code units.
  return text.replace(TELEGRAM_HTML_TAG, '')
    .replace(/&(?:amp|lt|gt|quot);/g, 'x')
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, encoded) =>
      (encoded[0].toLowerCase() === 'x' ? parseInt(encoded.slice(1), 16) : Number(encoded)) > 0xffff ? 'xx' : 'x'
    ).length;
}

let packCache;
let pendingLookup;

async function fetchFactionEmojiPack(token, fetchImpl) {
  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/getStickerSet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: PACK_NAME }),
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const { ok, result } = await response.json();
    if (!ok || result?.sticker_type !== 'custom_emoji' || !Array.isArray(result.stickers)) return null;
    const entries = new Map();
    for (const sticker of result.stickers) {
      const id = sticker?.custom_emoji_id;
      if (typeof id === 'string' && /^[0-9]{1,20}$/.test(id) &&
          typeof sticker.emoji === 'string' && sticker.emoji.trim()) {
        entries.set(id, sticker.emoji);
      }
    }
    return entries.size ? [...entries] : null;
  } catch {
    return null;
  }
}

async function getFactionEmojiPack(token, fetchImpl) {
  if (packCache && Date.now() < packCache.expiresAt) return packCache.entries;
  pendingLookup ||= fetchFactionEmojiPack(token, fetchImpl).then(entries => {
    packCache = { entries, expiresAt: Date.now() + (entries ? 3600_000 : 60_000) };
    pendingLookup = undefined;
    return entries;
  });
  return pendingLookup;
}

const MAX_MESSAGE_EMOJIS = 4;

function findStatementLines(lines) {
  const statements = [];
  const htmlTag = /<(\/?)[a-z][\w-]*(?:\s[^<>]*)?>/gi;
  let openTags = 0;
  // Odd indexes are the original line separators.
  for (let index = 0; index < lines.length; index += 2) {
    const line = lines[index];
    const startsOutsideMarkup = openTags === 0;
    const plain = line.replace(htmlTag, (_, closing) => {
      openTags = Math.max(0, openTags + (closing ? -1 : 1));
      return '';
    });
    if (startsOutsideMarkup && plain.trim() && !/<(?:code|pre)(?:\s|>)/i.test(line)) {
      statements.push(index);
    }
  }
  return statements;
}

// Sample without replacement so a message never repeats a pack emoji.
export async function addMoonboysMessageEmoji(text, token, fetchImpl = fetch) {
  if (typeof text !== 'string' || !text.trim() || text.includes('<tg-emoji') ||
      !isTelegramBotToken(token)) return text;
  const message = text.replace(FACTION_LINE, (line, name) =>
    Object.hasOwn(FACTION_LABELS, name) ? `Faction: ${FACTION_LABELS[name]}` : line);
  const lines = message.split(/(\r?\n)/);
  const statements = findStatementLines(lines);
  if (!statements.length) return text;
  const entries = await getFactionEmojiPack(token, fetchImpl);
  if (!entries) return text;
  const stickers = [...entries];
  const count = Math.min(MAX_MESSAGE_EMOJIS, statements.length, stickers.length);
  for (let index = 0; index < count; index++) {
    const selected = Math.floor(Math.random() * stickers.length);
    const [[id, emoji]] = stickers.splice(selected, 1);
    const position = Math.round(index * (statements.length - 1) / Math.max(1, count - 1));
    const lineIndex = statements[position];
    lines[lineIndex] = `<tg-emoji emoji-id="${id}">${escapeHtml(emoji)}</tg-emoji> ${lines[lineIndex]}`;
  }
  return lines.join('');
}

export function formatMoonboysAnnouncement(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/^[^\r\n]+/, heading => `<b>${heading}</b>`);
}

export async function sendMoonboysPlainTelegramPost(token, payload, send, fetchImpl = fetch) {
  if (!isTelegramBotToken(token)) return send(payload);
  const field = typeof payload.caption === 'string' ? 'caption' : 'text';
  const limit = field === 'caption' ? 1024 : 4096;
  const html = formatMoonboysAnnouncement(payload[field]);
  const branded = await addMoonboysMessageEmoji(html, token, fetchImpl);
  const response = await send({
    ...payload, [field]: telegramMessageLength(branded, 'HTML') <= limit ? branded : html, parse_mode: 'HTML',
  });
  // An explicit 400 means Telegram did not accept the post.
  return response.status === 400 ? send(payload) : response;
}
