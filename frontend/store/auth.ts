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
  email: "admin@sanchar.ai",
  fullName: "System Admin",
  role: "Admin"
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

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
          user: null,
          token: null,
          isAuthenticated: false,
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
        state?.setLoading(false)
      }
    }
  )
)
