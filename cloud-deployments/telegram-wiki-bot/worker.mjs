import { checkMedia, renderPortrait, sendBrandedMessage } from './branded-message.mjs';

const BOT_USERNAME = 'fcukdabot';
const COMMUNITY_USERNAME = 'gkniftyheads';
const WIKI_ORIGIN = 'https://cryptomoonboys.com';
const WIKI_SEARCH = 'https://api.cryptomoonboys.com/swarmsy/wiki-search';
const ASK = new RegExp(`^/ask(?:@${BOT_USERNAME})?(?=\\s|$)`, 'i');
const HELP = 'Ask me about the Crypto Moonboys Wiki with /ask@FCUKDABOT followed by your question. You can also reply directly to one of my answers.';
const WELCOME_CRON = '0 19 * * *';
const WELCOME = 'Welcome to the GKniftyHEADS Telegram channel powering the MIGHTY CRYPTO MOONBOYS MULTIVERSE!\n\nAsk me anything Moonboy related and let’s get you building…\n\nUse /ask@FCUKDABOT followed by your question, or reply right here.';
const encoder = new TextEncoder();

async function authenticated(actual, expected) {
  if (!actual || !expected || actual.length > 256) return false;
  const [left, right] = await Promise.all(
    [actual, expected].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))),
  );
  return crypto.subtle.timingSafeEqual(left, right);
}

function isCommunity(chat, env) {
  if (chat?.type !== 'group' && chat?.type !== 'supergroup') return false;
  if (env.TELEGRAM_GROUP_CHAT_ID) return String(chat.id) === env.TELEGRAM_GROUP_CHAT_ID;
  return chat.username?.toLowerCase() === COMMUNITY_USERNAME;
}

function questionFrom(message) {
  const text = message?.text?.trim();
  if (!text || !message.from || message.from.is_bot || message.sender_chat) return null;
  const command = text.match(ASK);
  if (command) return text.slice(command[0].length).trim();
  const replyingToBot = message.reply_to_message?.from?.username?.toLowerCase() === BOT_USERNAME;
  return replyingToBot && !text.startsWith('/') ? text : null;
}

function wikiLinks(sources) {
  if (!Array.isArray(sources)) return [];
  const links = [];
  for (const source of sources) {
    const url = typeof source?.url === 'string' ? URL.parse(source.url) : null;
    if (url?.origin !== WIKI_ORIGIN || url.username || url.password || url.href.length > 300) continue;
    if (!links.includes(url.href)) links.push(url.href);
    if (links.length === 3) break;
  }
  return links;
}

async function askWiki(env, question) {
  const response = await env.MOONBOYS_API.fetch(WIKI_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(21_000),
  });
  const data = await response.json();
  const links = wikiLinks(data?.wiki_sources);
  if (response.ok && typeof data?.answer === 'string' && data.answer.trim()) {
    return { text: data.answer.trim(), links };
  }
  if (response.status === 429) {
    const text = data?.error === 'daily_limit'
      ? 'SWARMSY has reached its daily Wiki answer limit. Try again after midnight UTC.'
      : 'SWARMSY is getting too many questions. Try again in a minute.';
    return { text, links };
  }
  return { text: 'SWARMSY Wiki search is temporarily unavailable.', links };
}

async function telegram(env, method, body = {}) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_COMMUNITY_BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5_000),
    });
    const data = await response.json();
    if (response.ok && data.ok) return data.result;
  } catch {
    // Keep token-bearing request URLs and upstream errors out of responses and logs.
  }
  throw new Error(`Telegram ${method} failed`);
}

async function replyContent(env, question) {
  if (question.length === 1 || question.length > 600) {
    return { text: 'Send a Wiki question between 2 and 600 characters.' };
  }
  if (!question) return { text: HELP };
  try {
    return await askWiki(env, question);
  } catch {
    return {
      text: 'SWARMSY Wiki search is temporarily unavailable. You can still browse the Wiki.',
      links: [WIKI_ORIGIN + '/search.html'],
    };
  }
}

async function reply(env, message, question) {
  const [content, portrait] = await Promise.all([
    replyContent(env, question),
    renderPortrait(env, `sparky:reply:${message.chat.id}:${message.message_id}`),
  ]);
  await sendBrandedMessage(env, {
    chat_id: message.chat.id,
    reply_parameters: { message_id: message.message_id },
    ...(message.is_topic_message ? { message_thread_id: message.message_thread_id } : {}),
  }, content, portrait);
}

async function dailyWelcome(env, scheduledTime) {
  const group = await telegram(env, 'getChat', {
    chat_id: env.TELEGRAM_GROUP_CHAT_ID || '@' + COMMUNITY_USERNAME,
  });
  if (!isCommunity(group, env)) throw new Error('Daily welcome community mismatch');
  const date = new Date(scheduledTime).toISOString().slice(0, 10);
  const portrait = await renderPortrait(env, `sparky:welcome:${group.id}:${date}`);
  await sendBrandedMessage(env, { chat_id: group.id }, { text: WELCOME }, portrait);
}

async function setup(env, register) {
  if (!env.TELEGRAM_COMMUNITY_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ error: 'telegram_secrets_missing' }, { status: 503 });
  }
  try {
    const bot = await telegram(env, 'getMe');
    if (bot.username?.toLowerCase() !== BOT_USERNAME) {
      return Response.json({ error: 'wrong_bot_token' }, { status: 409 });
    }
    const group = await telegram(env, 'getChat', {
      chat_id: env.TELEGRAM_GROUP_CHAT_ID || '@' + COMMUNITY_USERNAME,
    });
    const member = await telegram(env, 'getChatMember', { chat_id: group.id, user_id: bot.id });
    if (!isCommunity(group, env) || ['left', 'kicked'].includes(member.status) ||
        (member.status === 'restricted' && (!member.is_member || !member.can_send_messages))) {
      return Response.json({ error: 'bot_cannot_post_in_community' }, { status: 409 });
    }
    if (register) {
      await telegram(env, 'setWebhook', {
        url: env.TELEGRAM_WEBHOOK_URL,
        secret_token: env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ['message'],
      });
    }
    const webhook = await telegram(env, 'getWebhookInfo');
    return Response.json({
      bot: bot.username,
      group: group.username || group.title,
      membership: member.status,
      webhook_registered: webhook.url === env.TELEGRAM_WEBHOOK_URL,
      webhook_host: webhook.url ? URL.parse(webhook.url)?.hostname ?? null : null,
      pending_updates: webhook.pending_update_count,
      last_error_date: webhook.last_error_date ?? null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}

export default {
  async scheduled(event, env) {
    if (event.cron === WELCOME_CRON) await dailyWelcome(env, event.scheduledTime);
  },

  async fetch(request, env, ctx) {
    const { pathname: path, searchParams } = new URL(request.url);
    if (path === '/health' && request.method === 'GET') {
      const ready = Boolean(env.TELEGRAM_COMMUNITY_BOT_TOKEN && env.TELEGRAM_WEBHOOK_SECRET);
      return Response.json({ ready }, { status: ready ? 200 : 503 });
    }
    if (path === '/setup' && ['GET', 'POST'].includes(request.method)) {
      if (!await authenticated(request.headers.get('X-Swarmsy-Setup-Secret'), env.SETUP_SECRET)) {
        return new Response(null, { status: 404 });
      }
      if (request.method === 'GET' && searchParams.get('check') === 'media') return checkMedia(env);
      return setup(env, request.method === 'POST');
    }
    if (path !== '/telegram/webhook' || request.method !== 'POST') {
      return new Response(null, { status: 404 });
    }
    if (!await authenticated(request.headers.get('X-Telegram-Bot-Api-Secret-Token'), env.TELEGRAM_WEBHOOK_SECRET)) {
      return new Response(null, { status: 401 });
    }
    if (!env.TELEGRAM_COMMUNITY_BOT_TOKEN) return new Response(null, { status: 503 });
    const update = await request.json().catch(() => null);
    if (!update) return new Response(null, { status: 400 });
    const message = update.message;
    if (!isCommunity(message?.chat, env)) return new Response('OK');
    const question = questionFrom(message);
    if (question !== null) {
      ctx.waitUntil(reply(env, message, question).catch(() => console.error('SWARMSY reply delivery failed')));
    }
    return new Response('OK');
  },
};
