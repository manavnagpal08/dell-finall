"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const [status, setStatus] = useState("")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Integration Settings</h2>
          <p className="text-slate-500 text-sm">Configure global settings for data ingestion and synchronization.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setStatus("Integration sync settings saved for the current workspace.")}>
          Save Changes
        </Button>
      </div>

      {status && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">{status}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Sync Constraints</CardTitle>
            <CardDescription>Rules applied to all automated syncs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center justify-between">
                Enable Auto-Sync
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
              </label>
              <p className="text-xs text-slate-500">If disabled, all automated sync schedules will be paused.</p>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">Max Sync Duration (minutes)</label>
              <input type="number" defaultValue={60} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Handling</CardTitle>
            <CardDescription>What to do when validation fails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">On Validation Error</label>
              <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                <option>Skip invalid rows, import valid rows</option>
                <option>Fail entire job if any row is invalid</option>
                <option>Attempt auto-correction</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">Alert Notifications</label>
              <input type="email" defaultValue="operations.admin@sanchar.ai" className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Email for failure alerts" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
