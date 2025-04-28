import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export function withAuth<T>(Component: React.ComponentType<T>) {
  return (props: T) => {
    const { isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isAuthenticated) {
        router.replace('/login')
      }
    }, [isAuthenticated])

    if (!isAuthenticated) {
      return null  // or a loading spinner
    }
    return <Component {...props} />
  }
}
