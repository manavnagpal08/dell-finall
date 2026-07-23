"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import apiClient from "@/services/api-client"

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    apiClient.get("/integrations/jobs")
      .then((res) => setJobs(Array.isArray(res.data) ? res.data : []))
      .catch(() => setJobs([]))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Sync Jobs History</h2>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Job ID / Connector</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Started At</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium">Records (Imported / Updated / Failed)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{job.id}</div>
                      <div className="text-slate-500 text-xs mt-1">{job.connector_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {job.status === "completed" ? (
                        <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : job.status === "failed" ? (
                        <Badge variant="error" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="info" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Running
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(job.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {job.duration_seconds}s
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-600 font-medium">{job.rows_imported}</span>
                        <span className="text-slate-300">/</span>
                        <span className="text-emerald-600 font-medium">{job.rows_updated}</span>
                        <span className="text-slate-300">/</span>
                        <span className={job.rows_failed > 0 ? "text-red-600 font-bold" : "text-slate-500"}>{job.rows_failed}</span>
                      </div>
                      {job.error_message && (
                        <div className="text-xs text-red-500 mt-1">{job.error_message}</div>
                      )}
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No jobs found.
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
