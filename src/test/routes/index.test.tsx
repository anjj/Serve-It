import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route } from "@/routes/index";
import { ThemeProvider } from "@/components/ThemeProvider";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  useLocation: () => ({ pathname: "/" }),
  createFileRoute: (path: string) => (options: any) => ({
    options,
    useLoaderData: () => ({ demoEnabled: true }),
  }),
}));

function renderHomePage() {
  const queryClient = new QueryClient();
  const HomePage = (Route as any).options.component;

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HomePage />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("Home Page Route Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the landing page hero text and CTA buttons including the demo secondary button", () => {
    renderHomePage();
    expect(screen.getByText("The Unaltered Truth.")).toBeInTheDocument();
    expect(screen.getByText("Try the Demo")).toBeInTheDocument();
    expect(screen.getByText("Initiate Access")).toBeInTheDocument();
  });
});
