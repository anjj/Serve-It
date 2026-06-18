"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Search, Tag, Upload, Trash2 } from "lucide-react";
import UploadModal from "@/components/UploadModal";

type File = { id: string; title: string; slug: string; tags: string[]; createdAt: string; };

export default function WorkspaceDashboard() {
  const params = useParams();
  const rawCustomerSlug = params.customer_slug;
  const customer_slug = Array.isArray(rawCustomerSlug) ? rawCustomerSlug[0] : rawCustomerSlug;

  const { data: session, status } = useSession();
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspace/${customer_slug}/files`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) setError("Workspace not found or access denied.");
        else setError("Failed to load files.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFiles(data.files);

      const tags = new Set<string>();
      data.files.forEach((f: File) => f.tags.forEach(t => tags.add(t)));
      setAvailableTags(Array.from(tags).sort());

    } catch (err) {
      setError("An error occurred while fetching data.");
    }
    setLoading(false);
  }, [customer_slug]);

  const handleDelete = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      const res = await fetch(`/api/workspace/${customer_slug}/files`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete file.");
        return;
      }

      await fetchFiles();
    } catch (err) {
      alert("An error occurred while deleting the file.");
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && customer_slug) {
      // Basic client-side check to prevent unnecessary API calls and quick UI feedback
      const role = (session?.user as any)?.role;
      const userCustomerSlug = (session?.user as any)?.customer_slug;

      if (role === "CUSTOMER" && userCustomerSlug !== customer_slug) {
        setError("You do not have access to this workspace.");
        setLoading(false);
        return;
      }

      fetchFiles();
    }
  }, [status, customer_slug, fetchFiles, session]);

  if (status === "loading" || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    );
  }

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) || f.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? f.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md leading-5 bg-white dark:bg-zinc-800 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 sm:text-sm text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
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
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-zinc-700 focus:outline-none focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 sm:text-sm rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
                >
                  <option value="">All Tags</option>
                  {availableTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus:outline-none transition-colors duration-200 cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#121827] rounded-lg border border-gray-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors duration-200">
            <p>No files found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-white dark:bg-[#121827] overflow-hidden shadow-sm rounded-lg border border-gray-200 dark:border-zinc-800 hover:shadow-md transition-all duration-200">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-zinc-900 dark:text-zinc-100 mb-1 truncate" title={file.title}>{file.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 truncate">/{file.slug}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {file.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-305 transition-colors duration-200">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(file.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 focus:outline-none transition-colors duration-200"
                        aria-label="Delete File"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <a href={`/s/${customer_slug}/${file.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200">
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

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchFiles}
        customerSlug={customer_slug || ""}
      />
    </div>
  );
}
