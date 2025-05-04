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
  const { logout } = useAuth(); // unused now
  const router = useRouter();

  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<AccountingEntry[]>("/accounting_entries")
      .then((r) => setEntries(r.data))
      .catch(() => setError("Could not load accounting"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <p className="text-white text-center text-lg">Loading…</p>;

  if (error)
    return <p className="text-red-500 text-center text-lg">{error}</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-4xl p-8 bg-[#3e272380] backdrop-blur-md border-4 border-[#6d4c41] rounded-lg text-white shadow-lg">
        {/* ← BACK BUTTON */}
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-6 px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-6">Accounting History</h1>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#4e342e] text-white">
                <th className="px-4 py-3 border-b border-gray-500 text-left">
                  Timestamp
                </th>
                <th className="px-4 py-3 border-b border-gray-500 text-left">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.timestamp}
                  className="border-b border-gray-600 hover:bg-[#5d403780] transition-all"
                >
                  <td className="px-4 py-2">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">${e.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AccountingEntriesPage);
