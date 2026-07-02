"use client";

import { useState, useEffect } from "react";
import { Key } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

type User = { id: string; name: string | null; email: string | null; isAdmin: boolean };
type Customer = { id: string; name: string };
type UserCustomer = { customer: Customer };
type UserWithWorkspaces = User & { customers: UserCustomer[]; apiKeys?: { id: string }[] };

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithWorkspaces[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Record<string, string>>({});

  const [generatingKeyFor, setGeneratingKeyFor] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [displayedKey, setDisplayedKey] = useState<{ userId: string; key: string } | null>(null);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, customersRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/customers")]);
      
      if (!usersRes.ok || !customersRes.ok) throw new Error("Failed to fetch data");

      const usersData = await usersRes.json();
      const customersData = await customersRes.json();
      if (usersData.users) setUsers(usersData.users);
      if (customersData.customers) setCustomers(customersData.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (userId: string) => {
    const customerId = selectedWorkspaces[userId];
    if (!customerId) return;
    await fetch("/api/admin/users/assign", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() }, body: JSON.stringify({ userId, customerId }) });
    setSelectedWorkspaces(prev => ({ ...prev, [userId]: "" }));
    fetchData();
  };

  const handleRevoke = async (userId: string, customerId: string) => {
    await fetch("/api/admin/users/revoke", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() }, body: JSON.stringify({ userId, customerId }) });
    fetchData();
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    await fetch("/api/admin/users/role", { method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() }, body: JSON.stringify({ userId, isAdmin: !currentStatus }) });
    fetchData();
  };

  const handleGenerateKey = async (userId: string) => {
    if (!newKeyName) return;
    const res = await fetch("/api/admin/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-csrf-token": getCsrfToken() },
      body: JSON.stringify({ name: newKeyName, userId }),
    });
    const data = await res.json();
    if (data.success) {
      setDisplayedKey({ userId, key: data.key });
      setGeneratingKeyFor(null);
      setNewKeyName("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <h1 className="text-2xl font-bold mb-6">Users & Mapping</h1>
      {loading ? <p>Loading...</p> : (
        <div className="bg-white dark:bg-[#121827] shadow sm:rounded-md border border-border-color dark:border-zinc-800 transition-colors duration-200">
          <ul className="divide-y divide-gray-200 dark:divide-zinc-800">
            {users.map((u) => (
              <li key={u.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-meta font-medium text-zinc-900 dark:text-zinc-100">{u.name || "Unknown"} ({u.email})</p>
                      {u.apiKeys && u.apiKeys.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-meta font-medium bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400" title="API Key Generated">
                          <Key className="w-3 h-3 text-green-600 dark:text-green-400" />
                          Key Generated
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="text-meta text-zinc-500 dark:text-zinc-400">Admin:</span>
                       <button
                         onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                         className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:ring-offset-2 ${u.isAdmin ? 'bg-primary' : 'bg-gray-200 dark:bg-zinc-800'}`}
                       >
                         <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 shadow ring-0 transition duration-200 ease-in-out ${u.isAdmin ? 'translate-x-4' : 'translate-x-0'}`} />
                       </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2 text-meta">
                      <select
                        value={selectedWorkspaces[u.id] || ""}
                        onChange={(e) => setSelectedWorkspaces(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="border border-border-color dark:border-zinc-700 rounded px-2 py-1 bg-surface text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
                      >
                        <option value="">Assign Workspace...</option>
                        {customers.filter((c) => !u.customers.find((uc) => uc.customer.id === c.id)).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <button onClick={() => handleAssign(u.id)} className="bg-primary text-white dark:text-zinc-900 px-3 py-1 rounded hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer">Assign</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 justify-end">
                      {u.customers.map((uc) => (
                        <span key={uc.customer.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-meta font-medium bg-surface-hover dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 transition-colors duration-200">
                          {uc.customer.name}
                          <button type="button" onClick={() => handleRevoke(u.id, uc.customer.id)} className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none">&times;</button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col items-end gap-2 border-t border-border-color dark:border-zinc-800 pt-4 w-full">
                      {generatingKeyFor === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Key Label (e.g. My Key)"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            className="border border-border-color dark:border-zinc-700 bg-surface text-zinc-900 dark:text-zinc-100 rounded px-2 py-1 text-meta focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 dark:focus:ring-zinc-100 dark:focus:border-zinc-100 transition-colors duration-200"
                          />
                          <button
                            onClick={() => handleGenerateKey(u.id)}
                            className="bg-primary dark:hover:bg-green-700 text-white px-2 py-1 rounded text-meta hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setGeneratingKeyFor(null)}
                            className="text-zinc-500 dark:text-zinc-400 text-meta hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setGeneratingKeyFor(u.id)}
                          className="bg-surface-hover dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded border border-border-color dark:border-zinc-700 text-meta hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-200 cursor-pointer"
                        >
                          Generate API Key
                        </button>
                      )}

                      {displayedKey?.userId === u.id && (
                        <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded text-meta max-w-sm">
                          <p className="font-bold text-yellow-800 dark:text-yellow-450 mb-1">Save this key now! It will not be shown again.</p>
                          <code className="block bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded break-all text-yellow-900 dark:text-yellow-250">{displayedKey.key}</code>
                          <button onClick={() => setDisplayedKey(null)} className="mt-2 text-yellow-800 dark:text-yellow-450 underline text-meta">
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
