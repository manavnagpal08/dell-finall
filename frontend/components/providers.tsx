"use client"

import React, { useEffect, useMemo, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createClient, isSupabaseConfigured } from "@/utils/supabase/client"
import { useAuthStore, UserRole } from "@/store/auth"

function resolveRole(role: unknown): UserRole {
  const value = typeof role === "string" ? role : "Viewer"
  return ["Admin", "Operations Manager", "Logistics Analyst", "Viewer"].includes(value)
    ? (value as UserRole)
    : "Viewer"
}

function AuthSessionBridge({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => (isSupabaseConfigured ? createClient() : null), [])
  const { setSession, setLoading } = useAuthStore()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let mounted = true
    const finishWithoutSession = () => {
      if (!mounted) return
      setLoading(false)
    }

    const sessionTimeout = window.setTimeout(finishWithoutSession, 2500)

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      window.clearTimeout(sessionTimeout)
      const session = data.session

      if (session?.user) {
        setSession(
          {
            id: session.user.id,
            email: session.user.email || "",
            fullName:
              (session.user.user_metadata?.full_name as string | undefined) ||
              (session.user.user_metadata?.name as string | undefined) ||
              session.user.email ||
              "Operations User",
            role: resolveRole(session.user.app_metadata?.role || session.user.user_metadata?.role),
            avatarUrl: session.user.user_metadata?.avatar_url as string | undefined,
          },
          session.access_token || null
        )
      } else {
        finishWithoutSession()
      }
    }).catch(() => {
      window.clearTimeout(sessionTimeout)
      finishWithoutSession()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setLoading(false)
        return
      }
      setSession(
        {
          id: session.user.id,
          email: session.user.email || "",
          fullName:
            (session.user.user_metadata?.full_name as string | undefined) ||
            (session.user.user_metadata?.name as string | undefined) ||
            session.user.email ||
            "Operations User",
          role: resolveRole(session.user.app_metadata?.role || session.user.user_metadata?.role),
          avatarUrl: session.user.user_metadata?.avatar_url as string | undefined,
        },
        session.access_token || null
      )
    })

    return () => {
      mounted = false
      window.clearTimeout(sessionTimeout)
      subscription.unsubscribe()
      setLoading(false)
    }
  }, [setLoading, setSession, supabase])

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBridge>{children}</AuthSessionBridge>
    </QueryClientProvider>
  )
}
