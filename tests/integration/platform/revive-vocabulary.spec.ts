import { afterEach, expect, it, vi } from "vitest";
import { parseQueueQuery } from "../../../apps/platform-api/src/action-centre/validation";
import { getHumanActions } from "../../../apps/platform-web/src/api/live";

afterEach(() => vi.unstubAllGlobals());

it.each(["pending", "approved", "rejected", "expired"])("Revive B-vocab sends API-accepted %s", async (status) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [] }));
  vi.stubGlobal("fetch", request);
  await getHumanActions({ status });
  expect(request).toHaveBeenCalledTimes(1);
  const url = new URL(String(request.mock.calls[0]![0]), "http://localhost");
  expect(parseQueueQuery(Object.fromEntries(url.searchParams), url.pathname)).toEqual({ status });
});

it("Revive B-vocab refuses legacy open instead of putting it on the wire", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [] }));
  vi.stubGlobal("fetch", request);
  // Exercise untyped callers and stale persisted filters at the boundary.
  await expect(getHumanActions(JSON.parse('{"status":"open"}'))).rejects.toThrow("Unsupported approval status");
  expect(request).not.toHaveBeenCalled();
  expect(() => parseQueueQuery({ status: "open" }, "/api/v1/action-centre")).toThrow();
});

it.each(["pending", "approved", "rejected", "expired"])("Revive B-vocab maps returned approval %s", async (status) => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [{ source_type: "approval", item: { id: "apr_test", status } }] })));
  expect((await getHumanActions())[0]?.status).toBe(status === "pending" ? "open" : status === "expired" ? "expired" : "resolved");
});
