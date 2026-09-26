import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "@/routes/admin/users";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: any) => ({
    options,
    component: options.component,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: { user: { id: "admin-1", email: "admin@example.com", name: "Admin" } },
  }),
}));

function renderUsersPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const UsersPage = (Route as any).options.component;

  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>
  );
}

describe("Admin Users Page - API Key Reset UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn() as any;
  });

  it("should display 'Reset API Key' button and modal warning when user has an existing API key", async () => {
    const mockUsers = [
      {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        isAdmin: false,
        customers: [],
        apiKeys: [{ id: "key-1" }],
      },
    ];

    vi.mocked(global.fetch).mockImplementation((url: any) => {
      if (url === "/api/admin/users") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers }),
        } as Response);
      }
      if (url === "/api/admin/customers") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ customers: [] }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText("Test User (test@example.com)")).toBeInTheDocument();
    });

    expect(screen.getByText("Key Generated")).toBeInTheDocument();
    const resetButton = screen.getByText("Reset API Key");
    expect(resetButton).toBeInTheDocument();

    fireEvent.click(resetButton);

    expect(screen.getByRole("heading", { name: "Reset API Key" })).toBeInTheDocument();
    expect(
      screen.getByText(/Warning: Resetting this API key will permanently revoke all existing API keys for Test User/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Primary Key")).toBeInTheDocument();
  });

  it("should trigger key reset, close modal, and show raw key banner when reset is confirmed", async () => {
    const mockUsers = [
      {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        isAdmin: false,
        customers: [],
        apiKeys: [{ id: "key-1" }],
      },
    ];

    vi.mocked(global.fetch).mockImplementation((url: any, options: any) => {
      if (url === "/api/admin/users") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ users: mockUsers }),
        } as Response);
      }
      if (url === "/api/admin/customers") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ customers: [] }),
        } as Response);
      }
      if (url === "/api/admin/apikeys" && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            key: "sk_live_serve-it_newkey123",
            record: { id: "new-key-id", name: "New Key Label", userId: "user-1" },
          }),
        } as Response);
      }
      return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
    });

    renderUsersPage();

    await waitFor(() => {
      expect(screen.getByText("Reset API Key")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Reset API Key"));

    const input = screen.getByPlaceholderText("e.g. Primary Key");
    fireEvent.change(input, { target: { value: "New Key Label" } });

    const resetButtons = screen.getAllByRole("button", { name: "Reset API Key" });
    // The second button is the confirm button inside the modal
    const confirmButton = resetButtons[resetButtons.length - 1];
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/admin/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Key Label", userId: "user-1" }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Save this key now! It will not be shown again.")).toBeInTheDocument();
      expect(screen.getByText("sk_live_serve-it_newkey123")).toBeInTheDocument();
    });
  });
});
