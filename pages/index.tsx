import Link from 'next/link'
import { withAuth } from '../utils/withAuth'
import { useAuth } from '../contexts/AuthContext'

function HomePage() {
  const { user, logout } = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Welcome, {user?.email}</h1>
      {user?.role === 'manager' && (
        <nav className="flex flex-col gap-2 mb-4">
          <Link href="/employees"><a>👥 Manage Employees</a></Link>
          <Link href="/inventory"><a>📦 Manage Inventory</a></Link>
          <Link href="/accounting"><a>📊 View Accounting</a></Link>
        </nav>
      )}
      {user?.role === 'barista' && (
        <nav className="flex flex-col gap-2 mb-4">
          <Link href="/pos"><a>☕ Create Order (POS)</a></Link>
        </nav>
      )}
      <button onClick={logout} className="mt-4 btn">
        Logout
      </button>
    </div>
  )
}

export default withAuth(HomePage)
