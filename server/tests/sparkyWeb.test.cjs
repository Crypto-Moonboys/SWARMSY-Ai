const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const source = readFileSync(
  join(__dirname, "../endpoints/sparkyWeb.js"),
  "utf8"
);
const token = "b".repeat(64);
const session = "a".repeat(64);
const publicSource = {
  title: "The Ninth Berth",
  url: "https://cryptomoonboys.com/wiki/the-ninth-berth.html",
  excerpt: "Public story excerpt",
};

function harness({ secret = token, canonical = true } = {}) {
  const state = { lookups: [], history: [], completions: [], writes: [] };
  const capabilities = {
    "node:crypto": require("node:crypto"),
    "../models/workspace": {
      Workspace: {
        get: async (query) => {
          state.lookups.push(query);
          return {
            id: 7,
            slug: "sparky",
            isCanonicalSparky: canonical,
            openAiHistory: 100,
          };
        },
      },
    },
    "../models/workspaceChats": {
      WorkspaceChats: {
        new: async (entry) => {
          state.writes.push(entry);
          return { chat: { id: 1 } };
        },
      },
    },
    "../utils/chats": {
      recentChatHistory: async (options) => {
        state.history.push(options);
        return { rawHistory: [], chatHistory: [] };
      },
    },
    "../utils/helpers": {
      stripThinkingFromText: (reply) => reply,
      resolveProviderConnector: async () => ({
        connector: {
          compressMessages: async (prompt) => prompt,
          getChatCompletion: async (prompt) => {
            state.completions.push(prompt);
            return { textResponse: "Workflow reply" };
          },
        },
      }),
    },
    "../utils/sparky": {
      SPARKY_WORKSPACE_SLUG: "sparky",
      getSparkySystemPrompt: () =>
        readFileSync(
          join(__dirname, "../sparky/packs/core/sparky-system-prompt.md"),
          "utf8"
        ),
      isCanonicalSparkyWorkspace: (workspace) => workspace.isCanonicalSparky,
    },
    "../utils/sparky/webSession": require("../utils/sparky/webSession"),
    "../utils/sparky/starterReplies": {
      getSparkyStarterReply: require("../utils/sparky/starterReplies")
        .getSparkyStarterReply,
    },
  };
  const loaded = { exports: {} };
  runInNewContext(source, {
    module: loaded,
    Buffer,
    require: (name) => {
      assert.ok(
        Object.hasOwn(capabilities, name),
        `Unexpected dependency: ${name}`
      );
      return capabilities[name];
    },
    process: { env: { SWARMSY_WEB_TOKEN: secret } },
  });
  let handlers;
  loaded.exports.sparkyWebEndpoints(
    {
      post: (path, ...registered) => {
        assert.equal(path, "/api/sparky-web/chat");
        handlers = registered;
      },
    },
    {
      json: ({ limit }) => {
        assert.equal(limit, "32kb");
        return (_request, _response, next) => next();
      },
    }
  );
  const send = async (body, authorization = `Bearer ${token}`) => {
    const result = { status: 200, headers: {} };
    const response = {
      set: (key, value) => {
        result.headers[key] = value;
      },
      status: (status) => {
        result.status = status;
        return response;
      },
      json: (data) => {
        result.body = data;
      },
    };
    const request = { body, get: () => authorization };
    await new Promise((resolve, reject) => {
      response.json = (data) => {
        result.body = data;
        resolve();
      };
      let index = 0;
      const next = () =>
        Promise.resolve(handlers[index++](request, response, next)).catch(
          reject
        );
      next();
    });
    return result;
  };
  return { state, send };
}

const request = (overrides = {}) => ({
  message: "Plan a campaign",
  session,
  sources: [],
  searchCanon: false,
  ...overrides,
});

test("requires the scoped secret before accepting any chat", async () => {
  const endpoint = harness();
  const result = await endpoint.send(request(), "Bearer invalid");
  assert.equal(result.status, 401);
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(endpoint.state.lookups.length, 0);
  assert.equal((await harness({ secret: "" }).send(request())).status, 503);
});

test("pins the canonical workspace and retains only scoped conversation history", async () => {
  const endpoint = harness();
  const result = await endpoint.send(
    request({ message: "@agent /reset", workspace: "owner" })
  );
  assert.equal(result.body.reply, "Workflow reply");
  assert.equal(endpoint.state.lookups[0].slug, "sparky");
  assert.equal(endpoint.state.history[0].apiSessionId, `sparky-web:${session}`);
  assert.equal(endpoint.state.history[0].messageLimit, 20);
  assert.equal(endpoint.state.completions[0].userPrompt, "@agent /reset");
  assert.match(
    endpoint.state.completions[0].systemPrompt,
    /## Creator Empire Blueprint[\s\S]+website's manual SPARKY workflow/
  );
  assert.equal(endpoint.state.writes[0].apiSessionId, `sparky-web:${session}`);
  assert.equal(
    (await harness({ canonical: false }).send(request())).status,
    503
  );
});

test("uses the existing starter workflow and supplies only approved public canon URLs", async () => {
  const endpoint = harness();
  const starter = await endpoint.send(
    request({ message: "Plan today’s local empire build." })
  );
  assert.match(starter.body.reply, /Street-To-Digital Proof Card/);
  assert.equal(endpoint.state.completions.length, 0);
  const privateSource = {
    ...publicSource,
    url: "https://brain.cryptomoonboys.com/api/context",
  };
  assert.equal(
    (
      await endpoint.send(
        request({ searchCanon: true, sources: [privateSource] })
      )
    ).status,
    400
  );
  assert.equal(
    (await endpoint.send(request({ sources: [publicSource] }))).status,
    400
  );
  const nftSource = {
    ...publicSource,
    url: "https://cryptomoonboys.com/data/nft-collections/gkniftyheads/templates.json",
  };
  const nft = await endpoint.send(
    request({ searchCanon: true, sources: [publicSource, nftSource] })
  );
  assert.equal(nft.status, 200);
  assert.equal(
    endpoint.state.completions[0].contextTexts[1],
    JSON.stringify(nftSource)
  );
  assert.equal(
    endpoint.state.completions[0].contextTexts[0],
    JSON.stringify(publicSource)
  );
  await endpoint.send(request({ searchCanon: true }));
  assert.match(
    endpoint.state.completions[1].systemPrompt,
    /no verified excerpts/i
  );
});
