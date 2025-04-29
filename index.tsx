// pages/index.tsx
import Link from "next/link";
import { withAuth } from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Welcome, {user?.email}</h1>

      {user?.role === "manager" ? (
        <nav className="flex flex-col gap-2 mb-4">
          <Link
            href="/employees"
            className="text-blue-600 hover:underline"
          >
            👥 Manage Employees
          </Link>
          <Link
            href="/inventory_items"
            className="text-blue-600 hover:underline"
          >
            📦 Manage Inventory
          </Link>
          <Link
            href="/accounting_entries"
            className="text-blue-600 hover:underline"
          >
            📊 View Accounting
          </Link>
        </nav>
      ) : (
        <nav className="flex flex-col gap-2 mb-4">
          <Link
            href="/pos"
            className="text-blue-600 hover:underline"
          >
            ☕ Create Order (POS)
          </Link>
        </nav>
      )}

      <button
        onClick={logout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}

export default withAuth(HomePage);
