import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Navbar from "@/components/Navbar";
import { Search, Tag } from "lucide-react";

type FileRecord = { id: string; title: string; slug: string; tags: string[]; createdAt: string };

export const Route = createFileRoute("/documents/$customer_slug")({ component: CustomerDocumentsPage });

function CustomerDocumentsPage() {
  const { customer_slug } = Route.useParams();
  const { status } = useSession();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");

  // The Customer Portal login is a separate grant path from the better-auth
  // user session; it isn't visible via useSession() at all, so it's checked
  // independently against /api/auth/customer-portal.
  const customerPortalQuery = useQuery({
    queryKey: ["customer-portal-session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/customer-portal");
      const data = await res.json();
      return data.session as { customerId: string; slug: string } | null;
    },
    enabled: status === "unauthenticated",
  });

  const customerPortalChecked = status === "authenticated" || customerPortalQuery.isFetched;
  const hasCustomerPortalSession = !!customerPortalQuery.data;
  const authorized = status === "authenticated" || hasCustomerPortalSession;

  useEffect(() => {
    if (!customerPortalChecked) return;
    if (!authorized) {
      navigate({ to: "/auth/signin", search: { callbackUrl: `/documents/${customer_slug}` } });
    }
  }, [customerPortalChecked, authorized, navigate, customer_slug]);

  const filesQuery = useQuery({
    queryKey: ["documents", customer_slug, "files"],
    queryFn: async () => {
      const res = await fetch(`/api/workspace/${customer_slug}/files`);
      if (!res.ok) {
        const message = res.status === 403 || res.status === 404 ? "Workspace not found or access denied." : "Failed to load files.";
        throw new Error(message);
      }
      const data = await res.json();
      return (data.files as FileRecord[]) || [];
    },
    enabled: authorized,
  });

  const files = filesQuery.data ?? [];
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach((f) => f.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [files]);

  if (status === "loading" || !customerPortalChecked || (authorized && filesQuery.isLoading)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!authorized || filesQuery.isError) {
    const message = !authorized ? "You do not have access to this dashboard." : (filesQuery.error as Error)?.message;
    return (
      <div className="min-h-screen bg-surface-hover flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10 flex items-center justify-center">
          <p className="text-red-500">{message}</p>
        </main>
      </div>
    );
  }

  const filteredFiles = files.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? f.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-surface-hover flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-md leading-5 bg-surface placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-meta"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {availableTags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border border-border-color focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-meta rounded-md bg-surface text-gray-900"
                >
                  <option value="">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-surface rounded-lg border border-border-color">
            <p className="text-gray-500">No files found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-surface overflow-hidden shadow-sm rounded-lg border border-border-color hover:shadow-md transition-shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1 truncate" title={file.title}>{file.title}</h3>
                  <p className="text-meta text-gray-500 mb-4 truncate">/{file.slug}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {file.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-meta font-medium bg-gray-100 text-gray-800">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-meta text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <a href={`/s/${customer_slug}/${file.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 border border-transparent text-meta font-medium rounded shadow-sm text-white bg-primary hover:bg-green-700">
                        View Document
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
