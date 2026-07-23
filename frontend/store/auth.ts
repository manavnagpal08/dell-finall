import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "Admin" | "Operations Manager" | "Logistics Analyst" | "Viewer"

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
}

interface AuthState {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setLoading: (isLoading: boolean) => void
  setSession: (user: UserProfile | null, token: string | null) => void
  logout: () => void
}

export const seededOperator: UserProfile = {
  id: "seeded-operator",
  email: "operations.admin@sanchar.ai",
  fullName: "Operations Admin",
  role: "Admin"
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: seededOperator,
      token: "local-operator-token",
      isAuthenticated: true,
      isLoading: false,

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setSession: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: Boolean(user && token),
          isLoading: false
        })
      },

      logout: () => {
        set({
          user: seededOperator,
          token: "local-operator-token",
          isAuthenticated: true,
          isLoading: false
        })
      }
    }),
    {
      name: "sanchar-auth-session",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.user || !state?.token) {
          state?.setSession(seededOperator, "local-operator-token")
          return
        }
        state.setLoading(false)
      }
    }
  )
)
