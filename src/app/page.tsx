import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8">
          <Logo className="mb-4" />

          <p className="text-xl sm:text-2xl text-foreground-muted max-w-lg leading-relaxed">
            A secure way to host and serve your AI-generated HTML files.
          </p>

          <div className="mt-8">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 px-8 py-4 bg-primary text-white hover:bg-green-700 text-base"
            >
              Get me Inside
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 border-t border-border-color bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-muted">
          <p>
            Free for use.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <FaGithub className="w-4 h-4" />
              <span>GitHub</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
