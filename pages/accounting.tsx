"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import api from "../services/api";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

interface AccountingEntry {
  timestamp: string;
  balance: number;
}

function AccountingEntriesPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AccountingEntry[]>("/accounting_entries")
      .then(r => setEntries(r.data))
      .catch(() => setError("Could not load accounting"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-8">
      {/* ← BACK BUTTON */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>

      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Accounting History</h1>
        <button onClick={logout} className="btn bg-red-500 text-white">
          Log Out
        </button>
      </div>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Timestamp</th>
            <th className="px-4 py-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.timestamp} className="border-t">
              <td className="px-4 py-2">
                {new Date(e.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-2">${e.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withAuth(AccountingEntriesPage);
