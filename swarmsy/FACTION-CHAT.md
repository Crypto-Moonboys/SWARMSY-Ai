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

Use the SWARMSY/AnythingLLM UI on swarmsy.cryptomoonboys.com after hosting is confirmed. Telegram website login must be verified server-side and mapped to an individual AnythingLLM user/session. Gate the origin and all chat APIs, including streaming and direct access. A frontend-only sign-in check or a shared master API key in the browser cannot provide this separation. Keep user conversations separate and grant shared canon as the first permission. Faction-specific private materials require independently verified membership and a separate access design.

For canon questions, cite the source and identify genuine gaps. Evaluate answers against approved material, including a question that confuses a market faction with an army. Check that signed-out requests are denied and two Telegram accounts cannot see each other's conversations before release.
