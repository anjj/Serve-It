import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getAuthSessionFn } from "@/lib/auth-session";
import Navbar from "@/components/Navbar";
import { Search, Tag, Upload, Trash2 } from "lucide-react";
import UploadModal from "@/components/UploadModal";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type FileRecord = { id: string; title: string; slug: string; tags: string[]; createdAt: string };

export const Route = createFileRoute("/dashboard/$customer_slug")({
  loader: async ({ params }) => {
    const { actor } = await getAuthSessionFn();
    if (!actor) {
      throw redirect({
        to: "/auth/signin",
        search: { callbackUrl: `/dashboard/${params.customer_slug}` },
      });
    }
    return { actor };
  },
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const { customer_slug } = Route.useParams();
  const { actor } = Route.useLoaderData();
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (!actor && !isPending && !session) navigate({ to: "/auth/signin" });
  }, [actor, isPending, session, navigate]);

  const filesQuery = useQuery({
    queryKey: ["workspace", customer_slug, "files"],
    queryFn: async () => {
      const res = await fetch(`/api/workspace/${customer_slug}/files`);
      if (!res.ok) {
        const message = res.status === 403 || res.status === 404 ? "Workspace not found or access denied." : "Failed to load files.";
        throw new Error(message);
      }
      const data = await res.json();
      return (data.files as FileRecord[]) || [];
    },
    enabled: !!actor || !!session,
  });

  const deleteFile = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/workspace/${customer_slug}/files`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete file.");
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace", customer_slug, "files"] }),
    onError: (err: Error) => alert(err.message),
  });

  const files = filesQuery.data ?? [];
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    files.forEach((f) => f.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [files]);

  if ((!actor && isPending) || filesQuery.isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (filesQuery.isError) {
    return (
      <div className="min-h-screen bg-canvas text-foreground flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10 flex items-center justify-center">
          <p className="text-red-500">{(filesQuery.error as Error).message}</p>
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
    <div className="min-h-screen bg-canvas text-foreground flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border-color rounded-[var(--radius-button)] leading-5 bg-surface placeholder-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-meta text-foreground transition-colors duration-200"
              placeholder="Query files..."
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
                  className="block w-full pl-3 pr-10 py-2 text-base border border-border-color focus:outline-none focus:ring-primary focus:border-primary sm:text-meta rounded-[var(--radius-button)] bg-surface text-foreground transition-colors duration-200"
                >
                  <option value="">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              <span>Secure Upload</span>
            </Button>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-foreground-muted">No files found matching your criteria.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="flex flex-col hover:shadow-md transition-all duration-200">
                <h3 className="text-lg leading-6 font-medium text-foreground mb-1 truncate" title={file.title}>{file.title}</h3>
                <p className="text-meta text-foreground-muted mb-4 truncate">/{file.slug}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {file.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-[var(--radius-button)] text-meta font-medium bg-surface border border-border-color text-foreground-muted transition-colors duration-200">{tag}</span>
                  ))}
                </div>

                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="text-meta text-foreground-muted">{new Date(file.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this file?")) deleteFile.mutate(file.id);
                      }}
                      className="inline-flex items-center p-1.5 border border-transparent text-meta font-medium rounded text-red-600 hover:bg-red-50 focus:outline-none transition-colors duration-200"
                      aria-label="Delete File"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <a href={`/s/${customer_slug}/${file.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 border border-transparent text-meta font-medium rounded-[var(--radius-button)] shadow-sm text-white bg-primary hover:bg-green-700 transition-colors duration-200">
                      Access Document
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["workspace", customer_slug, "files"] })}
        customerSlug={customer_slug}
      />
    </div>
  );
}
