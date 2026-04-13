import test from "node:test";
import assert from "node:assert/strict";

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";

test("health endpoint returns ok", async () => {
  const response = await fetch(`${API_BASE}/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "ok");
});

test("deps endpoint returns structured dependency object", async () => {
  const response = await fetch(`${API_BASE}/health/deps`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(typeof body.dependencies, "object");
  assert.equal(typeof body.dependencies.ai, "object");
  assert.equal(typeof body.dependencies.mongo, "object");
  assert.equal(typeof body.dependencies.redis, "object");
});
