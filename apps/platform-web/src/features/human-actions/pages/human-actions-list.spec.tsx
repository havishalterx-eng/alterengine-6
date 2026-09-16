import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, it, vi } from "vitest"
import { HumanActionsList } from "./human-actions-list"

vi.mock("@/api/http", async (importOriginal) => ({ ...await importOriginal<typeof import("@/api/http")>(), isLiveApi: true }))
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it("Revive B-vocab tabs issue canonical approval status requests", async () => {
  const request = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ data: [] }))
  vi.stubGlobal("fetch", request)
  const user = userEvent.setup()
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><HumanActionsList /></QueryClientProvider>)
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
  expect(String(request.mock.calls[0]![0])).toContain("status=pending")
  for (const status of ["approved", "rejected", "expired"]) {
    request.mockClear()
    await user.click(view.getByRole("tab", { name: new RegExp(status, "i") }))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
    expect(String(request.mock.calls[0]![0])).toContain(`status=${status}`)
  }
  request.mockClear()
  await user.click(view.getByRole("tab", { name: /^All$/ }))
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1))
  expect(String(request.mock.calls[0]![0])).not.toContain("status=")
})
