import Link from 'next/link'
import withAuth from '../utils/withAuth'
import { useAuth } from '../contexts/AuthContext'

function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="p-8 rounded-lg border-4 border-[#6d4c41] bg-[#3e272380] backdrop-blur-md w-full max-w-2xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-white">
          Welcome, {user?.email}
        </h1>

        {user?.role === 'manager' && (
          <nav className="flex flex-col gap-4 mb-8 text-xl">
            <Link href="/employees" className="text-blue-400 hover:underline">
              👥 Manage Employees
            </Link>
            <Link href="/inventory" className="text-blue-400 hover:underline">
              📦 Manage Inventory
            </Link>
            <Link href="/accounting" className="text-blue-400 hover:underline">
              📊 View Accounting
            </Link>
            <Link href="/menu_items" className="text-blue-400 hover:underline">
              📋 View Menu
            </Link>
            <Link href="/analytics" className="text-blue-400 hover:underline">
              📈 Analytics
            </Link>
            <Link href="/work-schedules" className="text-blue-400 hover:underline">
              ⏰ Work Schedules
            </Link>
          </nav>
        )}

        {user?.role === 'barista' && (
          <nav className="flex flex-col gap-4 mb-8 text-xl">
            <Link href="/pos" className="text-blue-400 hover:underline">
              ☕ Create Order (POS)
            </Link>
          </nav>
        )}

        <button
          onClick={logout}
          className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default withAuth(HomePage)