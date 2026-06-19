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
  const rawCustomerSlug = params?.customer_slug;
  const customer_slug = Array.isArray(rawCustomerSlug) ? rawCustomerSlug[0] : rawCustomerSlug;

  const { status } = useSession();
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
    if (status === "authenticated" && customer_slug) fetchFiles();
  }, [status, customer_slug, fetchFiles]);

  if (status === "loading" || loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-gray-900"
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
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No files found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFiles.map((file) => (
              <div key={file.id} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-1 truncate" title={file.title}>{file.title}</h3>
                  <p className="text-sm text-gray-500 mb-4 truncate">/{file.slug}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {file.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{tag}</span>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-400">{new Date(file.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-red-600 hover:bg-red-50 focus:outline-none"
                        aria-label="Delete File"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <a href={`/s/${customer_slug}/${file.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
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
