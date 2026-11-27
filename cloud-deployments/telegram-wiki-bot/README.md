# SWARMSY Telegram Wiki bot

The `swarmsy-telegram` Cloudflare Worker serves the GKniftyHEADS Telegram group. Ask with `/ask@SWARMSYBOT Who are the Nomad Bears?`, or reply directly to a bot answer. Group chatter and private chats are ignored. A direct reply should include enough context to stand on its own.

A service binding calls `moonboys-api` at `POST /swarmsy/wiki-search`, the same public-Wiki endpoint used by the website. The bot includes up to three official source links. The website and Telegram share the AI endpoint's daily answer budget.

## Deployment settings

| Setting | Value |
| --- | --- |
| Worker | `swarmsy-telegram` |
| Entry module | `worker.mjs` |
| Service binding | `MOONBOYS_API` → `moonboys-api` |
| Variable | `TELEGRAM_WEBHOOK_URL` → `https://swarmsy-telegram.sercullen.workers.dev/telegram/webhook` |
| Secret | `TELEGRAM_BOT_TOKEN` → existing @SWARMSYBOT token from BotFather |
| Secret | `TELEGRAM_WEBHOOK_SECRET` → random Telegram-compatible secret |
| Secret | `SETUP_SECRET` → separate random operator secret |
| Optional variable | `TELEGRAM_GROUP_CHAT_ID` → exact group ID if the group is private or changes username |

Once the bot is in the group and the secrets are deployed, authenticate to `GET /setup` with the `X-Swarmsy-Setup-Secret` header to check bot identity, group membership, and webhook status. `POST /setup` with the same header registers the webhook after validating the bot and group. Confirm `webhook_registered: true`, then try the example command in the group. Remove the `SETUP_SECRET` binding if operator access is no longer needed.

Keep Worker traces disabled unless token-bearing Telegram API URL paths can be redacted. Application errors are logged without messages, credentials, or request URLs.
