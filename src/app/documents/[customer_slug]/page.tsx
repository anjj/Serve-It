"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Search, Tag } from "lucide-react";

type File = { id: string; title: string; slug: string; tags: string[]; createdAt: string; };

export default function CustomerDocumentsPage() {
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/auth/signin?callbackUrl=/documents/${customer_slug}`);
    }
  }, [status, router, customer_slug]);

  useEffect(() => {
    if (status === "authenticated" && customer_slug) {
       // Validate that the user should be here
       const role = (session?.user as any)?.role;
       const userCustomerSlug = (session?.user as any)?.customer_slug;
       if (role === "CUSTOMER" && userCustomerSlug !== customer_slug) {
          setError("You do not have access to this dashboard.");
          setLoading(false);
          return;
       }
       fetchFiles();
    }
  }, [status, customer_slug, fetchFiles, session]);

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
    </div>
  );
}
