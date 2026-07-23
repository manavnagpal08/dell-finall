"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/services/api-client"

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    apiClient.get("/integrations/logs")
      .then((res) => setLogs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setLogs([]))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Audit Logs</h2>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Event Type</th>
                  <th className="px-6 py-4 font-medium">Message</th>
                  <th className="px-6 py-4 font-medium">User</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        log.event_type.includes("error") || log.event_type.includes("warning")
                          ? "warning"
                          : "neutral"
                      } className={
                        log.event_type.includes("error") || log.event_type.includes("warning")
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }>
                        {log.event_type.replace("_", " ").toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {log.user}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
