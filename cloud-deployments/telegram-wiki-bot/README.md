# SWARMSY Telegram Wiki bot

The `swarmsy-telegram` Cloudflare Worker serves the GKniftyHEADS Telegram group. Ask with `/ask@FCUKDABOT Who are the Nomad Bears?`, or reply directly to a bot answer. Group chatter and private chats are ignored. A direct reply should include enough context to stand on its own.

Every outgoing reply, help message, and daily welcome uses the Moonboy Builder portrait and up to four distinct emojis from the GKMoonboys pack. Wiki links use compact numbered citations. Long answers are clipped to the Telegram photo caption limit. If Telegram rejects the custom emoji, the bot retries the photo with a standard moon emoji. Text delivery is a fallback when an image cannot be rendered or Telegram definitively rejects it.

A service binding calls `moonboys-api` at `POST /swarmsy/wiki-search`, the same public-Wiki endpoint used by the website. The bot includes up to three official source links. The website and Telegram share the AI endpoint's daily answer budget.

## Deployment settings

| Setting | Value |
| --- | --- |
| Worker | `swarmsy-telegram` |
| Entry module | `worker.mjs` |
| Images binding | `IMAGES` |
| Cron trigger | `0 19 * * *` (daily at 19:00 UTC) |
| Service binding | `MOONBOYS_API` → `moonboys-api` |
| Variable | `TELEGRAM_WEBHOOK_URL` → `https://swarmsy-telegram.sercullen.workers.dev/telegram/webhook` |
| Secret | `TELEGRAM_COMMUNITY_BOT_TOKEN` → existing @FCUKDABOT token from BotFather |
| Secret | `TELEGRAM_WEBHOOK_SECRET` → random Telegram-compatible secret |
| Secret | `SETUP_SECRET` → separate random operator secret |
| Optional variable | `TELEGRAM_GROUP_CHAT_ID` → exact group ID if the group is private or changes username |

Once the bot is in the group and the secrets are deployed, authenticate to `GET /setup` with the `X-Swarmsy-Setup-Secret` header to check bot identity, group membership, and webhook status. The status also reports the current webhook hostname so an earlier deployment can be identified before switching it. `POST /setup` with the same header registers the webhook after validating the bot and group. Confirm `webhook_registered: true`, then try the example command in the group. Remove the `SETUP_SECRET` binding if operator access is no longer needed.

Keep Worker traces disabled unless token-bearing Telegram API URL paths can be redacted. Application errors are logged without messages, credentials, or request URLs.

Run authenticated `GET /setup?check=media` to render a sample portrait and check that the GKMoonboys sticker set loads. This check sends no Telegram message. Production delivery logs record the status, whether a photo was used and how many custom emoji entities Telegram returned.

The renderer and custom emoji helpers in `moonboys-media/` mirror [the website Worker’s Telegram modules](https://github.com/Crypto-Moonboys/Crypto-Moonboys.github.io/tree/33b0d1ad172a9d3b577a379db287a519075ac9e7/workers/moonboys-api/telegram). The renderer reads the live homepage builder manifest and layer assets.
