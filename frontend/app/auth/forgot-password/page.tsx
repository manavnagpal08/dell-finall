"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email) return

    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (resetError) {
      setError(resetError.message)
      return
    }

    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans select-none">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md shadow-blue-500/10 mb-3">
            <span className="text-xl font-bold">V</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">Sanchar AI OS</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="text-center">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-slate-700 text-xs font-medium leading-relaxed mb-6">
              If an account exists for <span className="font-bold">{email}</span>, you will receive a password reset link shortly.
            </div>
            <Link 
              href="/auth/login"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-brand-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 font-medium leading-relaxed text-center mb-4">
              Enter your corporate email address below and we will send you instructions to reset your password.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs placeholder-slate-400 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-brand-primary hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-colors"
            >
              Send Reset Instructions
            </button>

            <div className="text-center mt-6">
              <Link 
                href="/auth/login"
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
