import { afterEach, expect, it, vi } from "vitest";
import { parseQueueQuery } from "../../../apps/platform-api/src/action-centre/validation";
import { getHumanActions } from "../../../apps/platform-web/src/api/live";

afterEach(() => vi.unstubAllGlobals());

it.each(["open", "claimed", "resolved", "all"])("Human Actions tab %s stays off approval-only API filter", async (status) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ data: [] }));
  vi.stubGlobal("fetch", request);
  await getHumanActions({ status });
  expect(request).toHaveBeenCalledTimes(1);
  const url = new URL(String(request.mock.calls[0]![0]), "http://localhost");
  expect(parseQueueQuery(Object.fromEntries(url.searchParams), url.pathname)).toEqual({ limit: 200 });
});

it.each(["pending", "approved", "rejected", "expired"])("Action Centre retains engine approval status %s", (status) => {
  expect(parseQueueQuery({ status }, "/api/v1/action-centre")).toEqual({ status });
});
