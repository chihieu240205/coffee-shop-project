// pages/dashboard.tsx
import Link from "next/link";
import { withAuth } from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

function Dashboard() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold">Welcome to your Dashboard</h1>
      <nav className="space-x-4">
        <Link href="/employees" className="text-blue-600 hover:underline">
          Employees
        </Link>
        <Link href="/inventory_items" className="text-blue-600 hover:underline">
          Inventory
        </Link>
        <Link href="/accounting_entries" className="text-blue-600 hover:underline">
          Accounting
        </Link>
      </nav>
      <button
        onClick={logout}
        className="mt-8 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Log Out
      </button>
    </div>
  );
}
export default withAuth(Dashboard);
