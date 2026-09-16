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
    expect(await api.testTrigger(triggerId)).toEqual({ success: true, message: "Trigger test accepted.", eventId: "evt_test" })
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`/api/v1/triggers/${triggerId}/actions/test`, expect.objectContaining({ method: "POST", body: "{}", credentials: "include" }))
  })
  it("testTrigger fails when its route is absent", async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Route not found" }, { status: 404 }))
    await expect(api.testTrigger(triggerId)).rejects.toThrow("Route not found")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it("testTrigger rejects a success-shaped response without an event", async () => {
    fetchMock.mockResolvedValue(Response.json({ success: true }))
    await expect(api.testTrigger(triggerId)).rejects.toThrow("Trigger test returned no event ID")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it("removeTrigger refuses honestly while no delete route exists", async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Route not found" }, { status: 404 }))
    await expect(api.removeTrigger(triggerId)).rejects.toThrow("Trigger removal is not available")
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
