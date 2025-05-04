import Link from 'next/link'
import withAuth from '../utils/withAuth'
import { useAuth } from '../contexts/AuthContext'

function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="p-8 rounded-lg border-4 border-[#6d4c41] bg-[#3e272380] backdrop-blur-md w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-white">Welcome, {user?.email}</h1>

        {user?.role === 'manager' && (
          <nav className="flex flex-col gap-4 mb-8">
            <Link href="/employees">
              <span className="text-blue-400 hover:underline text-xl cursor-pointer">👥 Manage Employees</span>
            </Link>
            <Link href="/inventory">
              <span className="text-blue-400 hover:underline text-xl cursor-pointer">📦 Manage Inventory</span>
            </Link>
            <Link href="/accounting">
              <span className="text-blue-400 hover:underline text-xl cursor-pointer">📊 View Accounting</span>
            </Link>
            <Link href="/menu_items">
              <span className="text-blue-400 hover:underline text-xl cursor-pointer">📋 View Menu</span>
            </Link>
            {user?.role === "manager" && (
            <Link href="/analytics" className="text-blue-400 hover:underline text-xl">
              📈 Analytics
            </Link>
            )}
          </nav>
        )}

        {user?.role === 'barista' && (
          <nav className="flex flex-col gap-4 mb-8">
            <Link href="/pos">
              <span className="text-blue-400 hover:underline text-xl cursor-pointer">☕ Create Order (POS)</span>
            </Link>
          </nav>
        )}

        <button onClick={logout} className="w-full py-2 bg-red-500 hover:bg-red-500 text-white font-semibold rounded">
          Logout
        </button>
      </div>
    </div>
  )
}

export default withAuth(HomePage)