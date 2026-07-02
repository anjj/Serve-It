"use client";

import { useState, useEffect } from "react";
import { getCsrfToken } from "@/lib/csrf-client";

type Customer = { id: string; name: string; slug: string; isActive: boolean };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");

  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [displayedKey, setDisplayedKey] = useState<{customerId: string, key: string} | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() }, body: JSON.stringify({ name, slug, password }) });
    setName(""); setSlug(""); setPassword("");
    fetchCustomers();
  };

  const handleGenerateKey = async (customerId: string) => {
    if (!newKeyName) return;
    const res = await fetch("/api/admin/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
      body: JSON.stringify({ name: newKeyName, customerId })
    });
    const data = await res.json();
    if (data.success) {
      setDisplayedKey({ customerId, key: data.key });
      setGeneratingFor(null);
      setNewKeyName("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6">Manage Customers (Tenants)</h1>
      <form onSubmit={handleCreate} className="bg-white dark:bg-[#121827] p-6 rounded-lg shadow-sm border border-border-color dark:border-zinc-800 mb-8 flex gap-4 items-end flex-wrap transition-colors duration-200">
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
      </form>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white dark:bg-[#121827] shadow sm:rounded-md border border-border-color dark:border-zinc-800 transition-colors duration-200">
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
            {customers.map((c) => (
              <li key={c.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-meta font-medium text-zinc-900 dark:text-zinc-100">{c.name}</p>
                  <p className="text-meta text-zinc-500 dark:text-zinc-400">Slug: {c.slug} | Active: {c.isActive ? 'Yes' : 'No'}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                   {generatingFor === c.id ? (
                     <div className="flex items-center gap-2">
                       <input
                         type="text"
                         placeholder="Key Label (e.g. MCP Sidecar)"
                         value={newKeyName}
                         onChange={(e) => setNewKeyName(e.target.value)}
                         className="border border-border-color dark:border-zinc-700 bg-surface text-zinc-900 dark:text-zinc-100 rounded px-2 py-1 text-meta focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
                       />
                       <button onClick={() => handleGenerateKey(c.id)} className="bg-primary dark:hover:bg-green-700 text-white px-2 py-1 rounded text-meta hover:bg-green-700 dark:hover:bg-green-800 transition-colors">Save</button>
                       <button onClick={() => setGeneratingFor(null)} className="text-zinc-500 dark:text-zinc-400 text-meta hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">Cancel</button>
                     </div>
                   ) : (
                     <button onClick={() => setGeneratingFor(c.id)} className="bg-surface-hover dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded border border-border-color dark:border-zinc-700 text-meta hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200 cursor-pointer">
                       Generate API Key
                     </button>
                   )}

                   {displayedKey?.customerId === c.id && (
                     <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded text-meta max-w-sm">
                       <p className="font-bold text-yellow-850 dark:text-yellow-450 mb-1">Save this key now! It will not be shown again.</p>
                       <code className="block bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded break-all text-yellow-900 dark:text-yellow-250">{displayedKey.key}</code>
                       <button onClick={() => setDisplayedKey(null)} className="mt-2 text-yellow-800 dark:text-yellow-450 underline text-meta">Dismiss</button>
                     </div>
                   )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
