"use client";
import { useState, useEffect } from "react";

type User = { id: string; name: string | null; email: string | null; isAdmin: boolean };
type Customer = { id: string; name: string };
type UserCustomer = { customer: Customer };
type UserWithWorkspaces = User & { customers: UserCustomer[] };

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithWorkspaces[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, customersRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/customers")]);
    const usersData = await usersRes.json();
    const customersData = await customersRes.json();
    if (usersData.users) setUsers(usersData.users);
    if (customersData.customers) setCustomers(customersData.customers);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (userId: string) => {
    const customerId = selectedWorkspaces[userId];
    if (!customerId) return;
    await fetch("/api/admin/users/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, customerId }) });
    setSelectedWorkspaces(prev => ({ ...prev, [userId]: "" }));
    fetchData();
  };

  const handleRevoke = async (userId: string, customerId: string) => {
    await fetch("/api/admin/users/revoke", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, customerId }) });
    fetchData();
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    await fetch("/api/admin/users/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, isAdmin: !currentStatus }) });
    fetchData();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Users & Mapping</h1>
      {loading ? <p>Loading...</p> : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((u) => (
              <li key={u.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.name || "Unknown"} ({u.email})</p>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="text-sm text-gray-500">Admin:</span>
                       <button
                         onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                         className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${u.isAdmin ? 'bg-blue-600' : 'bg-gray-200'}`}
                       >
                         <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${u.isAdmin ? 'translate-x-4' : 'translate-x-0'}`} />
                       </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2 text-sm">
                      <select
                        value={selectedWorkspaces[u.id] || ""}
                        onChange={(e) => setSelectedWorkspaces(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Assign Workspace...</option>
                        {customers.filter((c) => !u.customers.find((uc) => uc.customer.id === c.id)).map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <button onClick={() => handleAssign(u.id)} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Assign</button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 justify-end">
                      {u.customers.map((uc) => (
                        <span key={uc.customer.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {uc.customer.name}
                          <button type="button" onClick={() => handleRevoke(u.id, uc.customer.id)} className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none">&times;</button>
                        </span>
                      ))}
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
