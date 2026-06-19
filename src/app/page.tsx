import Link from "next/link";
import { FaGithub, FaServer, FaShieldAlt, FaBolt, FaRobot } from "react-icons/fa";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <main className="w-full min-h-[100vh] flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-4xl w-full flex flex-col items-center text-center gap-8">
          <Logo className="transform scale-200 origin-center mb-10 mt-6" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-foreground mb-4">
            The Unaltered Truth.
          </h1>
          <p className="text-xl text-foreground-muted mb-8 max-w-2xl mx-auto leading-relaxed">
            A specialized infrastructure layer for unmodified HTML serving. Engineered for extreme performance, rigorous cybersecurity, and absolute transparency.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 px-8 py-4 bg-primary text-white hover:bg-green-700 hover:shadow-lg hover:-translate-y-0.5 text-base w-full sm:w-auto"
            >
              Initiate Access
            </Link>
            <Link
              href="#architecture"
              className="inline-flex items-center justify-center rounded-[var(--radius-button)] font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-color focus:ring-offset-2 px-8 py-4 bg-background-alternate text-foreground border border-border-color hover:bg-border-color-soft text-base w-full sm:w-auto"
            >
              View Specifications
            </Link>
          </div>
        </div>
      </main>

      {/* Value Proposition Section */}
      <section className="w-full py-24 bg-background-alternate border-y border-border-color">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">Core Principles</h2>
            <p className="text-lg text-foreground-muted max-w-2xl mx-auto">
              We eliminated dynamic processing overhead to deliver the purest form of content delivery.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-background flex items-center justify-center rounded-sm border border-border-color mb-6 group-hover:border-primary transition-colors">
                <FaBolt className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Sub-Millisecond Delivery</h3>
              <p className="text-foreground-muted leading-relaxed">
                By serving exclusively static assets, we bypass the database and rendering layers entirely. Content is delivered to the edge instantly.
              </p>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-background flex items-center justify-center rounded-sm border border-border-color mb-6 group-hover:border-primary transition-colors">
                <FaShieldAlt className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Zero-Vector Surface</h3>
              <p className="text-foreground-muted leading-relaxed">
                No server-side rendering means no server-side vulnerabilities. Your infrastructure is insulated from dynamic execution exploits.
              </p>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-background flex items-center justify-center rounded-sm border border-border-color mb-6 group-hover:border-primary transition-colors">
                <FaServer className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Absolute Determinism</h3>
              <p className="text-foreground-muted leading-relaxed">
                What you deploy is exactly what the user receives. No middleware manipulation, no hidden injected scripts, just pure unmodified data.
              </p>
            </Card>

            <Card className="hover:shadow-md transition-shadow duration-300 group">
              <div className="w-12 h-12 bg-background flex items-center justify-center rounded-sm border border-border-color mb-6 group-hover:border-primary transition-colors">
                <FaRobot className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Agent Native</h3>
              <p className="text-foreground-muted leading-relaxed">
                Native Model Context Protocol (MCP) integration allows AI assistants to directly create and securely upload tools and interfaces on your behalf.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section id="architecture" className="w-full py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Transparent Operations.</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background-alternate border border-border-color flex items-center justify-center font-mono text-sm font-bold">1</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Authenticate & Secure</h4>
                    <p className="text-foreground-muted">Access your deterministic workspace via strict Entra ID verification.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background-alternate border border-border-color flex items-center justify-center font-mono text-sm font-bold">2</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Upload Artifacts</h4>
                    <p className="text-foreground-muted">Deploy your HTML and asset payloads directly to our isolated storage instances.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-mono text-sm font-bold">3</div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1">Global Replication</h4>
                    <p className="text-foreground-muted">Assets are instantly routed and cached globally, ready for unmodified consumption.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-xl">
              <div className="rounded-[var(--radius-card)] bg-[#0b0f19] border border-[#374151] p-6 shadow-2xl font-mono text-sm text-[#9ca3af] overflow-hidden">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-[#374151]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#374151]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#374151]"></div>
                </div>
                <div className="space-y-2">
                  <p><span className="text-[#1a8744]">➜</span> <span className="text-[#f3f4f6]">serve-it</span> deploy ./build</p>
                  <p>Authenticating workspace... <span className="text-[#1a8744]">OK</span></p>
                  <p>Analyzing static artifacts... <span className="text-[#1a8744]">OK</span> (12 files)</p>
                  <p>Uploading to secure storage...</p>
                  <p className="text-[#1a8744]">Success! Payload deployed.</p>
                  <p className="mt-4 break-all">URL: https://serve-it.local/s/workspace-1/index.html</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border-color bg-background-alternate">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground-muted">
          <p className="font-mono text-xs tracking-wider uppercase">
            Serve-It Infrastructure © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/auth/signin" className="hover:text-foreground transition-colors">
              Access Portal
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-foreground transition-colors"
            >
              <FaGithub className="w-4 h-4" />
              <span>Source</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
