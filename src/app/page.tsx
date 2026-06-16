import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full flex flex-col items-center text-center gap-8">

          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-900 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900">
            Serve-It
          </h1>

          <p className="text-xl sm:text-2xl text-zinc-600 max-w-lg leading-relaxed">
            A secure way to host and serve your AI-generated HTML files.
          </p>

          <div className="mt-8">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Get me Inside
            </Link>
          </div>
        </div>
      </main>

      <footer className="w-full py-6 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>
            Free for use.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/anjj/serve-it"
              className="flex items-center gap-2 hover:text-zinc-900 transition-colors"
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
