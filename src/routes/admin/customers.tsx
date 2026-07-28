import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Customer = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count?: { files: number };
};

export const Route = createFileRoute("/admin/customers")({ component: CustomersPage });

function CustomersPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");

  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [displayedKey, setDisplayedKey] = useState<{ customerId: string; key: string } | null>(null);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmSlugInput, setConfirmSlugInput] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: customers = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return (data.customers as Customer[]) || [];
    },
  });

  const createCustomer = useMutation({
    mutationFn: async () => {
      setCreateError(null);
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create customer");
      }
    },
    onSuccess: () => {
      setName("");
      setSlug("");
      setPassword("");
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      setCreateError(err.message);
    },
  });

  const generateKey = useMutation({
    mutationFn: async (customerId: string) => {
      const res = await fetch("/api/admin/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, customerId }),
      });
      return { customerId, data: await res.json() };
    },
    onSuccess: ({ customerId, data }) => {
      if (data.success) {
        setDisplayedKey({ customerId, key: data.key });
        setGeneratingFor(null);
        setNewKeyName("");
      }
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async ({ customerId, confirmSlug }: { customerId: string; confirmSlug: string }) => {
      const res = await fetch("/api/admin/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, confirmSlug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete customer");
      }
      return res.json();
    },
    onSuccess: () => {
      setConfirmingDeleteId(null);
      setConfirmSlugInput("");
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
    onError: (err: any) => {
      setDeleteError(err.message);
    },
  });

  return (
    <div className="max-w-4xl mx-auto text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6">Manage Customers (Tenants)</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createCustomer.mutate();
        }}
        className="bg-white dark:bg-[#121827] p-6 rounded-lg shadow-sm border border-border-color dark:border-zinc-800 mb-8 flex gap-4 items-end flex-wrap transition-colors duration-200"
      >
        <div>
          <label htmlFor="customer-name" className="block text-meta font-medium text-zinc-700 dark:text-zinc-300">Name</label>
          <input
            id="customer-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-border-color dark:border-zinc-700 rounded-md shadow-sm py-2 px-3 sm:text-meta bg-surface text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
          />
        </div>
        <div>
          <label htmlFor="customer-slug" className="block text-meta font-medium text-zinc-700 dark:text-zinc-300">Slug</label>
          <input
            id="customer-slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 block w-full border border-border-color dark:border-zinc-700 rounded-md shadow-sm py-2 px-3 sm:text-meta bg-surface text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
          />
        </div>
        <div>
          <label htmlFor="customer-password" className="block text-meta font-medium text-zinc-700 dark:text-zinc-300">Password</label>
          <input
            id="customer-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-border-color dark:border-zinc-700 rounded-md shadow-sm py-2 px-3 sm:text-meta bg-surface text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
          />
        </div>
        <button
          type="submit"
          className="bg-primary border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-meta font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors duration-200 cursor-pointer"
        >
          Create Customer
        </button>

        {createError && (
          <div className="w-full text-red-600 dark:text-red-400 font-medium text-meta mt-2">
            Error: {createError}
          </div>
        )}
      </form>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white dark:bg-[#121827] shadow sm:rounded-md border border-border-color dark:border-zinc-800 transition-colors duration-200">
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
            {customers.map((c) => (
              <li key={c.id} className="px-6 py-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-meta font-medium text-zinc-900 dark:text-zinc-100">{c.name}</p>
                    <p className="text-meta text-zinc-500 dark:text-zinc-400">Slug: {c.slug} | Active: {c.isActive ? 'Yes' : 'No'}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {confirmingDeleteId !== c.id && (
                      <div className="flex items-center gap-2">
                        {generatingFor === c.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Key Label (e.g. MCP Sidecar)"
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                              className="border border-border-color dark:border-zinc-700 bg-surface text-zinc-900 dark:text-zinc-100 rounded px-2 py-1 text-meta focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
                            />
                            <button onClick={() => generateKey.mutate(c.id)} className="bg-primary dark:hover:bg-green-700 text-white px-2 py-1 rounded text-meta hover:bg-green-700 dark:hover:bg-green-800 transition-colors">Save</button>
                            <button onClick={() => setGeneratingFor(null)} className="text-zinc-500 dark:text-zinc-400 text-meta hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => setGeneratingFor(c.id)} className="bg-surface-hover dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded border border-border-color dark:border-zinc-700 text-meta hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200 cursor-pointer">
                              Generate API Key
                            </button>
                            <button
                              onClick={() => {
                                setConfirmingDeleteId(c.id);
                                setConfirmSlugInput("");
                                setDeleteError(null);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded border border-transparent text-meta transition-colors duration-200 cursor-pointer font-medium"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {displayedKey?.customerId === c.id && (
                      <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded text-meta max-w-sm">
                        <p className="font-bold text-yellow-850 dark:text-yellow-450 mb-1">Save this key now! It will not be shown again.</p>
                        <code className="block bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded break-all text-yellow-900 dark:text-yellow-250">{displayedKey.key}</code>
                        <button onClick={() => setDisplayedKey(null)} className="mt-2 text-yellow-800 dark:text-yellow-450 underline text-meta">Dismiss</button>
                      </div>
                    )}
                  </div>
                </div>

                {confirmingDeleteId === c.id && (
                  <div className="mt-2 p-4 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 rounded-md text-meta transition-colors duration-200">
                    <p className="text-red-800 dark:text-red-400 font-medium mb-2">
                      This permanently deletes {c.name}, its {c._count?.files ?? 0} documents, and all stored files. This cannot be undone. Type the slug <strong className="select-all bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded">{c.slug}</strong> to confirm.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type slug to confirm"
                        value={confirmSlugInput}
                        onChange={(e) => setConfirmSlugInput(e.target.value)}
                        className="border border-red-300 dark:border-red-800 bg-surface text-zinc-900 dark:text-zinc-100 rounded px-3 py-1.5 text-meta focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                      />
                      <button
                        onClick={() => deleteCustomerMutation.mutate({ customerId: c.id, confirmSlug: confirmSlugInput })}
                        disabled={confirmSlugInput !== c.slug || deleteCustomerMutation.isPending}
                        className="bg-red-600 text-white px-3 py-1.5 rounded text-meta font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        {deleteCustomerMutation.isPending ? "Deleting..." : "Confirm Delete"}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmingDeleteId(null);
                          setConfirmSlugInput("");
                          setDeleteError(null);
                        }}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 px-3 py-1.5 text-meta transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    {deleteError && (
                      <p className="mt-2 text-red-600 dark:text-red-400 font-semibold">{deleteError}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
