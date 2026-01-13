import { useEffect, useRef } from 'react'

import { setAuthAccessors } from '@/api/client'
import useUserStore from '@/store/UserStore'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, getAccessToken, logout } = useUserStore()
  const initialized = useRef(false)

  useEffect(() => {
    // Only initialize once
    if (initialized.current) {
      return
    }
    initialized.current = true

    // Set up auth accessors for the API client
    setAuthAccessors(getAccessToken, logout)

    // Check authentication status on mount
    checkAuth()
  }, [checkAuth, getAccessToken, logout])

  return <>{children}</>
}
