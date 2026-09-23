import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./http", async (importOriginal) => ({
  ...await importOriginal<typeof import("./http")>(),
  isLiveApi: true,
}))
import { api } from "./client"

const triggerId = "trg_018f47a5-7b2c-7d10-8f11-123456789abc"
const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => { vi.stubGlobal("fetch", fetchMock); fetchMock.mockReset() })
afterEach(() => vi.unstubAllGlobals())

describe("Revive B5 request contracts", () => {
  it("testTrigger issues POST and returns the accepted event", async () => {
    fetchMock.mockResolvedValue(Response.json({ eventId: "evt_test", triggerId, triggerVersion: 1 }))
    expect(await api.testTrigger(triggerId)).toEqual({ success: true, message: "Test event recorded.", eventId: "evt_test" })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`/api/v1/triggers/${triggerId}/actions/test`, expect.objectContaining({ method: "POST", body: "{}", credentials: "include" }))
  })
  it("testTrigger fails when its route is absent", async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Route not found" }, { status: 404 }))
    await expect(api.testTrigger(triggerId)).rejects.toThrow("Route not found")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it("testTrigger rejects a success-shaped response without an event", async () => {
    fetchMock.mockResolvedValue(Response.json({ success: true }))
    await expect(api.testTrigger(triggerId)).rejects.toThrow("No test event was returned")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it("removeTrigger archives through the status route with the ETag the read returned", async () => {
    const trigger = { id: triggerId, workflowId: "wf_1", type: "manual", status: "enabled", createdAt: "2026-09-25T00:00:00Z" }
    fetchMock
      .mockResolvedValueOnce(Response.json(trigger, { headers: { ETag: '"v3"' } }))
      .mockResolvedValueOnce(Response.json({ ...trigger, status: "archived" }))
    await api.removeTrigger(triggerId)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = fetchMock.mock.calls[1]!
    expect(url).toBe(`/api/v1/triggers/${triggerId}/status`)
    expect(init).toMatchObject({ method: "PATCH", body: JSON.stringify({ status: "archived" }) })
    expect(new Headers(init!.headers).get("If-Match")).toBe('"v3"')
  })
})
