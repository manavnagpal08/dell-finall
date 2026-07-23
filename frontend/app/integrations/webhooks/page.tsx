"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Webhook as WebhookIcon, Trash2, Edit2 } from "lucide-react"
import apiClient from "@/services/api-client"

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([])

  useEffect(() => {
    apiClient.get("/integrations/webhooks")
      .then((res) => setWebhooks(Array.isArray(res.data) ? res.data : []))
      .catch(() => setWebhooks([]))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Webhooks</h2>
          <p className="text-slate-500 text-sm">Push real-time events to external systems.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webhooks.map((webhook) => (
          <Card key={webhook.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <WebhookIcon className="h-5 w-5 text-slate-700" />
                </div>
                {webhook.active ? (
                  <Badge variant="success" className="bg-emerald-500">Active</Badge>
                ) : (
                  <Badge variant="neutral" className="bg-slate-200 text-slate-600">Inactive</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{webhook.name}</CardTitle>
              <CardDescription className="font-mono text-xs truncate" title={webhook.url}>
                {webhook.url}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex flex-wrap gap-2 mt-2">
                {webhook.events.map((event: string) => (
                  <Badge key={event} variant="neutral" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] px-1.5 py-0">
                    {event}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-emerald-700">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
