import test from "node:test";
import assert from "node:assert/strict";
import { fetchAccount } from "../backend/provider.ts";
test(
  "authorized live provider integration",
  { skip: !process.env.LIVE_TEST_USERNAME },
  async () => {
    const d = await fetchAccount(process.env.LIVE_TEST_USERNAME!, process.env);
    assert.equal(
      d.username.toLowerCase(),
      process.env.LIVE_TEST_USERNAME!.toLowerCase(),
    );
    assert.ok(d.dataSource);
  },
);
