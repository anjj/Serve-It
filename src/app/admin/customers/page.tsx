"use client";
import { useState, useEffect } from "react";

type Customer = { id: string; name: string; slug: string; isActive: boolean };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  // API Key Generation State
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [displayedKey, setDisplayedKey] = useState<{customerId: string, key: string} | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/customers");
    const data = await res.json();
    if (data.customers) setCustomers(data.customers);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug }) });
    setName(""); setSlug("");
    fetchCustomers();
  };

  const handleGenerateKey = async (customerId: string) => {
    if (!newKeyName) return;
    const res = await fetch("/api/admin/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Customers (Tenants)</h1>
      <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-sm border mb-8 flex gap-4 items-end">
        <div><label className="block text-sm font-medium text-gray-700">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Slug</label><input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" /></div>
        <button type="submit" className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700">Create Customer</button>
      </form>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {customers.map((c) => (
              <li key={c.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500">Slug: {c.slug} | Active: {c.isActive ? 'Yes' : 'No'}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                   {generatingFor === c.id ? (
                     <div className="flex items-center gap-2">
                       <input type="text" placeholder="Key Label (e.g. MCP Sidecar)" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm" />
                       <button onClick={() => handleGenerateKey(c.id)} className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700">Save</button>
                       <button onClick={() => setGeneratingFor(null)} className="text-gray-500 text-sm hover:text-gray-700">Cancel</button>
                     </div>
                   ) : (
                     <button onClick={() => setGeneratingFor(c.id)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded border text-sm hover:bg-gray-200">
                       Generate API Key
                     </button>
                   )}

                   {displayedKey?.customerId === c.id && (
                     <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm max-w-sm">
                       <p className="font-bold text-yellow-800 mb-1">Save this key now! It will not be shown again.</p>
                       <code className="block bg-yellow-100 p-2 rounded break-all">{displayedKey.key}</code>
                       <button onClick={() => setDisplayedKey(null)} className="mt-2 text-yellow-800 underline text-xs">Dismiss</button>
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
