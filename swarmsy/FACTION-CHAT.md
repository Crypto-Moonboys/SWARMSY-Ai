# Faction SWARMSY

The SWARMSY repo owns the faction-facing AnythingLLM application and its public canon corpus. The Brand Brain at brain.cryptomoonboys.com is a separate owner archive. The faction runtime needs its own storage, model credentials and deployment. It has no owner archive credentials or owner-only Brand Brain skill.

## Canon source

The Waterfront's signed leader-lore API already uses the published site catalog and cites public pages. Autonomous NPC conversations use local dialogue. The public catalog can support the AnythingLLM workspace without copying the game dialogue engine or granting access to the private archive.

From the repo root, export individually selected public wiki records:

```sh
python swarmsy/capture_public_canon.py --out ./faction-canon-export /wiki/crypto-moonboys.html
```

Review the exported text and import it to the shared canon workspace in the dedicated faction instance. Each file contains its source URL. The exporter checks the live catalog, skips pages that decline indexing, and extracts article text. New canon revisions need an explicit refresh. It currently handles public wiki HTML.

## Website release boundary

The public UI is at `https://cryptomoonboys.com/swarmsy.html`. The Moonboys
API verifies a Telegram credential and derives an opaque conversation key
from the verified Telegram ID and a browser UUID. The dedicated faction
AnythingLLM runtime hosts the canonical SPARKY workspace and
`POST /api/sparky-web/chat`. This endpoint uses the shipped SPARKY prompt,
the requesting conversation and vetted published canon excerpts. The native
AnythingLLM user interface and developer APIs remain restricted to operators
on this deployment.

## Release

1. Run this revision on the dedicated faction instance with its own storage
   and model credentials. Complete the native SPARKY bootstrap and check
   that the canonical workspace is present. Keep the private Brand Brain
   skill, credentials and data off this instance.
2. Expose the exact SPARKY web route at
   `https://swarmsy.cryptomoonboys.com/api/sparky-web/chat`. Keep the
   AnythingLLM UI, generic APIs and administration behind operator access.
   Set `SWARMSY_WEB_TOKEN` on the faction server and Moonboys API Worker to
   the same newly generated secret (for example, 32 random bytes encoded
   in hex). Set a different random secret as `SWARMSY_WEB_SESSION_KEY` only
   on the Worker. The session key can stay stable across API token rotation.
3. Deploy the Moonboys API and website once the upstream route is verified.
   The Worker rate limits are per Cloudflare location. Configure a provider
   budget appropriate for the community release.
4. Verify that signed-out requests are refused, a completed chat stays
   scoped to one Telegram account and a new chat starts clean. Ask who
   the Bitcoin Kid Army answers to and check the public source links.
   Verify a regular creator prompt works without a canon fetch and that
   a direct upstream request without the bridge token is refused.
