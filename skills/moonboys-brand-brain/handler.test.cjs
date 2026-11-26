const test = require("node:test");
const assert = require("node:assert/strict");
const { runtime } = require("./handler");

test("the skill fails closed on shared servers and only calls the approved Brain context route", async (t) => {
  const settings = { isMultiUserMode: async () => true };
  const mainRequire = require.main.require;
  t.mock.method(require.main, "require", (name) => name === "./models/systemSettings"
    ? { SystemSettings: settings } : mainRequire.call(require.main, name));
  const names = ["BRAIN_SWARMSY_OWNER_INSTANCE", "BRAIN_CONTEXT_TOKEN", "BRAIN_ACCESS_CLIENT_ID", "BRAIN_ACCESS_CLIENT_SECRET"];
  const before = names.map((name) => process.env[name]);
  t.after(() => names.forEach((name, index) => before[index] === undefined ? delete process.env[name] : process.env[name] = before[index]));
  const fetch = t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url, "https://brain.cryptomoonboys.com/api/context");
    assert.deepEqual(JSON.parse(options.body), { question: "When was the canon approved?" });
    assert.equal(options.redirect, "error");
    return Response.json({ records: [{ id: "record", title: "Canon decision" }] });
  });
  process.env.BRAIN_SWARMSY_OWNER_INSTANCE = "true";
  process.env.BRAIN_CONTEXT_TOKEN = "a".repeat(40);
  process.env.BRAIN_ACCESS_CLIENT_ID = "client";
  process.env.BRAIN_ACCESS_CLIENT_SECRET = "secret";
  assert.match(await runtime.handler({ question: "test" }), /single-user/);
  assert.equal(fetch.mock.callCount(), 0);
  settings.isMultiUserMode = async () => false;
  assert.match(await runtime.handler({ question: "  When was the canon approved?  " }), /Canon decision/);
  assert.equal(fetch.mock.callCount(), 1);
});
