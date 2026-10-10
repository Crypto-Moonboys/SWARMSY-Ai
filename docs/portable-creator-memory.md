# Portable Creator Memory — version 1

The public Creator Studio and SWARMSY use the **same** `sparky-creator-memory` JSON format. A creator may download the JSON, upload it to a different AI, edit it, and later re-import it. Markdown is a human-readable export, **not** the round-trip source.

## Data and approval boundaries

- `project`: title, activity kind, summary and next action.
- `identity`: voice, visual style, themes and boundaries, as user-supplied project context.
- `canon`: `independent`, `moonboys`, or `other`. This field **cannot** confer official canon status, NFT ownership, publishing permissions or commercial rights.
- `decisions`: **explicitly** creator-approved choices (not the same as verified factual claims).
- `ideas`: drafts and experiments (not approved facts).
- `sources`: HTTP(S) reference links (not automatically trusted or fetched).
- `assets`: labels and references to separate files; **not** embedded image bytes.
- `proofs`: notes only; importing does not verify evidence.
- `history`: user-supplied activity notes. Neither import nor export verifies past actions.

Canonical Crypto Moonboys lore belongs to the approved public source index:
https://cryptomoonboys.com/moonboy-canon-index.json
Editorial story-bibles and unreleased endings must not enter exported public creator packs. The creator's personal approval does not make lore official. Real-world licensing depends on separate verified terms.

## Privacy and portability

The public Studio works fully in the browser: local file input, in-memory editing, JSON / Markdown download, and clipboard handoff. No automatic upload, account, cloud sync, or background transfer. Imported records are untrusted: validated by format/version, projected onto known fields, capped at 256 KiB / 100 entries per collection, and rendered as text. Files referenced by an `assets` entry must be saved separately.

A ChatGPT URL never includes the creator's personal project record. Copy the handoff text, paste it into ChatGPT, or upload the exported JSON. Other AI tools have different document support. Where URLs cannot be read, provide the source text manually.

SWARMSY exports its existing SPARKY Records to this format and can import creator-approved decisions and draft ideas as **new records after confirmation**. It does not overwrite records silently, import proof as verified, or upload a file merely because it was selected. Duplicates are skipped against current visible records; if a network operation fails, review any partially created records.

## Schema example

```json
{
  "format": "sparky-creator-memory",
  "schema_version": 1,
  "created_at": "2026-10-10T12:00:00.000Z",
  "updated_at": "2026-10-10T12:00:00.000Z",
  "project": { "title": "Razor", "kind": "moonboy", "summary": "Creator-owned proposal", "next_action": "Draft biography" },
  "identity": { "voice": "Street-level", "visual_style": "Black and white stencil", "themes": "Belonging", "boundaries": "No invented NFT facts" },
  "canon": { "scope": "moonboys", "status": "creator-draft", "source_index": "https://cryptomoonboys.com/moonboy-canon-index.json", "notes": "" },
  "decisions": [{ "text": "Keep the stencil palette black and white", "approved_at": "2026-10-10T12:00:00.000Z", "source": "Creator" }],
  "ideas": [{ "text": "Explore an underground print shop origin", "created_at": "2026-10-10T12:00:00.000Z" }],
  "sources": [], "assets": [], "proofs": [], "history": []
}
```

## Validation / compatibility

- Strict `format` and integer `schema_version=1`.
- HTTP/HTTPS source links only. No external fetch during import.
- Unrecognised fields are dropped. Inbound `canon.status`, asset status and proof status are **never** trusted.
- The project never contains passwords, API keys or sensitive data by default. Users should not include private material they do not want to share.
- Changes to the schema require a new schema version or compatible additive handling in **both** repositories.
