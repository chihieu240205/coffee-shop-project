import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export function requireManager<T>(Component: React.ComponentType<T>) {
  return (props: T) => {
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (user?.role !== 'manager') {
        router.replace('/')
      }
    }, [user])

    if (user?.role !== 'manager') {
      return null
    }
    return <Component {...props} />
  }
}

