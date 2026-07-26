import { ThemeProvider } from "./ThemeProvider";

// better-auth's React client manages session state via its own store
// (subscribed through useSession()); unlike next-auth it needs no context
// provider wrapping the tree.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
