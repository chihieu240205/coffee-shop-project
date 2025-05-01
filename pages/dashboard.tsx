import Link from "next/link";
import withAuth from "../utils/withAuth";
import { useAuth } from "../contexts/AuthContext";

function Dashboard() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="p-8 rounded-lg border-4 border-[#6d4c41] bg-[#3e272380] backdrop-blur-md w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-white mb-6">Welcome to your Dashboard</h1>
        
        <nav className="flex flex-col gap-4 mb-8">
          <Link href="/employees" className="text-blue-400 hover:underline text-xl">👥 Employees</Link>
          <Link href="/inventory" className="text-blue-400 hover:underline text-xl">📦 Inventory</Link>
          <Link href="/accounting" className="text-blue-400 hover:underline text-xl">📊 Accounting</Link>
          <Link href="/menu_items" className="text-blue-400 hover:underline text-xl">📋 Manage Menu</Link>
          {user?.role === "manager" && (
            <Link href="/analytics" className="text-blue-400 hover:underline text-xl">
              📈 Analytics
            </Link>
          )}
        </nav>

        <button
          onClick={logout}
          className="btn bg-red-500 hover:bg-red-600"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

export default withAuth(Dashboard);
