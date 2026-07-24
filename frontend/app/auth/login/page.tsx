"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Lock, Mail, ShieldCheck, Package, Truck, Route, MapPin, BrainCircuit, EyeOff, Map, Check, Clock, UserRound, Building2 } from "lucide-react"
import { seededOperator, useAuthStore } from "@/store/auth"
import { createClient } from "@/utils/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function LoginPage() {
  const setSession = useAuthStore((state) => state.setSession)

  // Tab state: "signin" | "signup"
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin")

  // Sign in state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Sign up state
  const [fullName, setFullName] = useState("")
  const [company, setCompany] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState("")
  const [signupMessage, setSignupMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const loginEmail = email.trim()
    if (!loginEmail || !password) {
      setError("Please enter your email and password.")
      return
    }
    setIsLoading(true)
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      })
      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }
      if (data?.user) {
        setSession(
          {
            id: data.user.id,
            email: data.user.email || "",
            fullName: data.user.user_metadata?.full_name || loginEmail.split("@")[0],
            role: (data.user.app_metadata?.role || data.user.user_metadata?.role || "Viewer") as any,
          },
          data.session?.access_token || "supabase-token"
        )
        window.location.assign("/dashboard")
      }
    } else {
      if (loginEmail === seededOperator.email && password === "12345678") {
        setSession(seededOperator, "local-operator-token")
        window.location.assign("/dashboard")
      } else {
        setError("Invalid credentials. Use admin@sanchar.ai / 12345678 or configure Supabase.")
        setIsLoading(false)
      }
    }
  }

  const handleSeededLogin = () => {
    setEmail(seededOperator.email)
    setPassword("12345678")
    setError("")
    setSession(seededOperator, "local-operator-token")
    window.location.assign("/dashboard")
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError("")
    setSignupMessage("")
    if (!fullName || !signupEmail || !signupPassword) {
      setSignupError("Enter your name, email, and password.")
      return
    }
    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters.")
      return
    }
    if (!isSupabaseConfigured()) {
      setSignupError("Supabase is not configured. Add the project URL and publishable key before signup.")
      return
    }
    setSignupLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: fullName, company, role: "Viewer" },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    setSignupLoading(false)
    if (err) {
      setSignupError(err.message)
      return
    }
    setSignupMessage("Account created! Check your email to confirm, then sign in.")
    setTimeout(() => setActiveTab("signin"), 2000)
  }

  return (
    <main className="flex h-screen bg-[#02030a] p-4 text-slate-900 font-sans">
      <div className="flex w-full h-full gap-4">

        {/* Left Panel */}
        <section className="relative hidden w-[55%] flex-col justify-between overflow-hidden p-12 lg:flex rounded-[2rem] bg-[#0c0d1c] border border-cyan-500/30 shadow-[0_0_40px_-10px_rgba(6,182,212,0.3)]">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/sanchar-bg.png"
              alt="Logistics Background"
              fill
              priority
              sizes="55vw"
              className="object-cover opacity-80 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0b1a]/90 via-[#0a0b1a]/40 to-[#0a0b1a]/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#060714]/90 via-[#060714]/40 to-transparent" />
          </div>

          {/* Top Logo */}
          <div className="relative z-10 flex flex-col items-start gap-2">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Sanchar AI Logo" width={130} height={36} className="h-9 w-auto object-contain" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              SMARTER LOGISTICS. STRONGER TOMORROW.
            </p>
          </div>

          {/* Middle Content */}
          <div className="relative z-10 mt-14 max-w-[500px]">
            <h2 className="text-[44px] font-extrabold leading-[1.1] tracking-tight text-white">
              AI-Powered Logistics.<br />
              <span className="bg-gradient-to-r from-[#10b981] to-[#06b6d4] bg-clip-text text-transparent">
                Intelligence That<br />Keeps You Ahead.
              </span>
            </h2>
            <p className="mt-5 text-base font-medium leading-relaxed text-slate-300">
              Sanchar AI optimizes your supply chain with real-time insights, predictive intelligence and autonomous decisions.
            </p>
            <div className="mt-8 flex gap-3">
              {[
                { icon: Package, label: "Predictive\nMaintenance" },
                { icon: Truck, label: "Fleet\nMonitoring" },
                { icon: Route, label: "Route\nOptimization" },
                { icon: MapPin, label: "Live Shipment\nTracking" },
                { icon: BrainCircuit, label: "AI Decision\nEngine" },
              ].map((feature, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-white/5 p-3 text-center backdrop-blur-md transition-colors hover:border-cyan-400/50">
                  <feature.icon className="h-5 w-5 text-[#06b6d4]" strokeWidth={1.5} />
                  <span className="whitespace-pre-line text-[9px] font-bold text-slate-300 leading-tight">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating Widgets */}
          <div className="absolute right-12 top-10 z-10 w-[180px] rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex justify-between items-start">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <Truck className="h-3.5 w-3.5 text-[#10b981]" />
                Live Shipments
              </p>
            </div>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-3xl font-bold text-white">1,248</span>
              <span className="mb-1 text-[11px] font-bold text-[#10b981]">↑ 12.6%</span>
            </div>
            <svg className="mt-3 h-8 w-full stroke-cyan-400" fill="none" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 25 C 20 20, 30 25, 45 15 C 60 5, 75 25, 100 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="absolute right-12 top-40 z-10 flex w-[180px] items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                <Clock className="h-3.5 w-3.5 text-[#10b981]" />
                On-Time Delivery
              </p>
              <div className="mt-1 text-2xl font-bold text-white">96.8%</div>
              <div className="text-[11px] font-bold text-[#10b981]">↑ 8.4%</div>
            </div>
            <div className="relative h-12 w-12 rounded-full border-4 border-slate-700">
              <div className="absolute -inset-[4px] rounded-full border-4 border-transparent border-t-[#06b6d4] border-r-[#06b6d4] rotate-45" />
            </div>
          </div>

          <div className="relative z-10 mt-auto pt-16 flex flex-col gap-4">
            <div className="w-[180px] rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">
              <p className="text-[11px] font-medium text-slate-400">Cost Saved</p>
              <div className="mt-1 text-2xl font-bold text-white">₹ 2.45 Cr</div>
              <div className="text-[11px] font-bold text-[#10b981]">↑ 15.3%</div>
            </div>
            <div className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-[#080914]/80 p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Enterprise Grade Security</p>
                  <p className="text-[10px] leading-tight text-slate-400 mt-0.5">Your data is protected with end-to-end<br />encryption and AI threat detection.</p>
                </div>
              </div>
              <div className="mx-4 h-12 w-px shrink-0 bg-white/10" />
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-500">Trusted by logistics leaders</p>
                <div className="flex items-center gap-5">
                  <span className="text-sm font-black italic text-white/90">DHL</span>
                  <span className="text-sm font-black text-white/90">MAERSK</span>
                  <span className="text-sm font-black italic text-white/90">DELHIVERY</span>
                  <span className="text-xs font-black text-white/90">DP WORLD</span>
                  <span className="text-sm font-black italic text-white/90">BLUE DART</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel — unified sign in / sign up */}
        <section className="relative flex w-full flex-col justify-center bg-white px-8 py-12 lg:w-[45%] lg:px-20 rounded-[2rem] shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#06b6d4]/20 blur-3xl" />

          <div className="relative z-10 mx-auto w-full max-w-[420px]">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome to <span className="text-[#059669]">Sanchar </span><span className="text-[#10b981]">AI</span>
              </h2>
              <p className="mt-2 text-[13px] font-medium text-slate-500">
                Sign in to continue or create a new account
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="mb-8 flex rounded-xl bg-slate-50 p-1.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
              <button
                onClick={() => { setActiveTab("signin"); setError(""); setSignupError(""); setSignupMessage("") }}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${activeTab === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Sign In
                {activeTab === "signin" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#10b981] to-[#0ea5e9] rounded-b-lg" />}
              </button>
              <button
                onClick={() => { setActiveTab("signup"); setError(""); setSignupError(""); setSignupMessage("") }}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${activeTab === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
              >
                Create Account
                {activeTab === "signup" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#10b981] to-[#0ea5e9] rounded-b-lg" />}
              </button>
            </div>

            {/* ===== SIGN IN FORM ===== */}
            {activeTab === "signin" && (
              <>
                <button
                  onClick={handleSeededLogin}
                  className="mb-5 flex w-full items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left transition hover:bg-emerald-100"
                >
                  <span>
                    <span className="block text-[12px] font-black text-emerald-800">Continue as System Admin</span>
                    <span className="block text-[10px] font-semibold text-emerald-700/70">admin@sanchar.ai / 12345678</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-emerald-700" />
                </button>

                {error && (
                  <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-[44px] pr-4 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10"
                      autoComplete="email"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-[44px] pr-12 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10"
                      autoComplete="current-password"
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <EyeOff className="h-[18px] w-[18px]" />
                    </button>
                  </div>

                  <div className="relative">
                    <Map className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <div className="absolute left-[44px] top-2 text-[10px] font-medium text-slate-400">I am a...</div>
                    <select className="h-[52px] w-full appearance-none rounded-xl border border-slate-200 bg-white pl-[44px] pr-10 pt-[14px] text-[13px] font-bold text-slate-900 outline-none transition focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10">
                      <option value="logistics_operator">Logistics Operator</option>
                      <option value="admin">Administrator</option>
                      <option value="analyst">Data Analyst</option>
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-2 pt-2 text-[13px]">
                    <label className="flex items-center gap-2 font-medium text-slate-500 cursor-pointer">
                      <div className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 bg-white">
                        <Check className="h-3 w-3 text-transparent" />
                      </div>
                      Remember me
                    </label>
                    <Link href="/auth/forgot-password" className="font-semibold text-[#0ea5e9] hover:underline">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-[14px] font-bold text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] disabled:pointer-events-none disabled:opacity-70"
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                    <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              </>
            )}

            {/* ===== CREATE ACCOUNT FORM ===== */}
            {activeTab === "signup" && (
              <>
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] font-semibold leading-5 text-blue-800">
                  New accounts receive Viewer access by default. An admin can upgrade permissions later.
                </div>

                {signupError && (
                  <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-600">{signupError}</div>
                )}
                {signupMessage && (
                  <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{signupMessage}</div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="relative">
                    <UserRound className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full name"
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-[44px] pr-4 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10"
                    />
                  </div>

                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Company or team"
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-[44px] pr-4 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Email address"
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-[44px] pr-4 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10"
                      autoComplete="email"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Password (min 6 characters)"
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-[44px] pr-4 text-[13px] font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-4 focus:ring-sky-500/10"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={signupLoading}
                    className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-[14px] font-bold text-white shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] disabled:pointer-events-none disabled:opacity-70"
                  >
                    {signupLoading ? "Creating account..." : "Create secure account"}
                    <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              </>
            )}

            <p className="mt-8 text-center text-[11px] font-medium text-slate-400">
              By continuing, you agree to our{" "}
              <Link href="#" className="font-semibold text-[#0ea5e9] hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link href="#" className="font-semibold text-[#0ea5e9] hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </section>

      </div>
    </main>
  )
}
