"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, Lock, Mail, UserRound } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")

    if (!fullName || !email || !password) {
      setError("Enter your name, email, and password to create access.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured. Add the project URL and publishable key before signup.")
      return
    }

    setIsLoading(true)
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company,
          role: "Viewer",
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    setIsLoading(false)

    if (signupError) {
      setError(signupError.message)
      return
    }

    setMessage("Account created. Check your email if confirmation is required, then sign in.")
    window.setTimeout(() => router.replace("/auth/login"), 1800)
  }

  return (
    <main className="grid min-h-screen bg-[#07111f] text-white lg:grid-cols-[0.95fr_520px]">
      <section className="relative hidden overflow-hidden px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,118,206,0.35),transparent_34%),linear-gradient(135deg,#07111f,#13233b_55%,#0b1728)]" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-black text-[#059669]">V</span>
          <span className="text-sm font-black tracking-wide">Sanchar AI OS</span>
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-blue-200">Secure onboarding</p>
          <h1 className="font-display text-6xl font-black leading-[1.02] tracking-normal">
            Build a governed command center for every logistics decision.
          </h1>
          <p className="mt-6 text-lg font-medium leading-8 text-slate-300">
            Create access for route optimization, repair network planning, cost-control workflows, and executive approvals.
          </p>
        </div>
        <p className="relative z-10 text-xs font-bold uppercase tracking-wide text-slate-400">Default role: Viewer until upgraded by an admin</p>
      </section>

      <section className="flex items-center justify-center bg-[#f5f7fb] px-5 py-10 text-slate-950">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-950/10">
          <div className="mb-7">
            <Link href="/" className="mb-6 inline-flex items-center gap-3 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#059669] text-sm font-black text-white">V</span>
              <span className="text-sm font-black">Sanchar AI OS</span>
            </Link>
            <h2 className="font-display text-3xl font-black">Create account</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Start with viewer access. Admins can upgrade permissions later.</p>
          </div>

          <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-5 text-blue-900">
            Judge access: create an account here. If Supabase email confirmation is enabled, confirm the email first, then sign in. New accounts receive Viewer access by default.
          </div>

          {error && <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
          {message && <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">{message}</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            <Field icon={<UserRound className="h-4 w-4" />} label="Full name" value={fullName} onChange={setFullName} placeholder="Your name" />
            <Field icon={<Building2 className="h-4 w-4" />} label="Company or team" value={company} onChange={setCompany} placeholder="Operations team" />
            <Field icon={<Mail className="h-4 w-4" />} label="Email address" value={email} onChange={setEmail} placeholder="name@company.com" type="email" />
            <Field icon={<Lock className="h-4 w-4" />} label="Password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" type="password" />

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#059669] text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create secure account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-xs font-bold text-slate-500">
            Already have access?{" "}
            <Link href="/auth/login" className="text-[#059669] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#059669] focus:ring-2 focus:ring-blue-100"
        />
      </div>
    </div>
  )
}
