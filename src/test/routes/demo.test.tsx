import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "@/routes/demo";
import { ThemeProvider } from "@/components/ThemeProvider";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/demo" }),
  createFileRoute: (path: string) => (options: any) => ({
    options,
    useParams: () => ({}),
    useSearch: () => ({}),
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: null, // anonymous
  }),
  signOut: vi.fn(),
}));

function renderDemoPage() {
  const queryClient = new QueryClient();
  const DemoPage = (Route as any).options.component;

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DemoPage />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("Demo Page Route Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("should render the initial upload form and heading", () => {
    renderDemoPage();
    expect(screen.getByText("Try Serve-it Demo")).toBeInTheDocument();
    expect(screen.getByText("Generate Demo Link")).toBeInTheDocument();
  });

  it("should display the one-time result card after a successful upload", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({
        url: "http://localhost:3000/s/demo/abc123token",
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
    } as any);

    renderDemoPage();

    // Create a mock HTML file
    const file = new File(["<html>test</html>"], "mypage.html", { type: "text/html" });
    const fileInput = screen.getByText(/Click or drag HTML file to upload/i);

    // Simulate selecting file
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: "Generate Demo Link" });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Demo Link Generated!")).toBeInTheDocument();
      expect(screen.getByDisplayValue("http://localhost:3000/s/demo/abc123token")).toBeInTheDocument();
      expect(screen.getByText("One-Time View")).toBeInTheDocument();
    });
  });
});
