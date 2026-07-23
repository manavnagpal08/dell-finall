const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:3000"
const API_URL = process.env.API_URL || "http://127.0.0.1:8000/api/v1"

const checks = []

function record(name, ok, detail) {
  checks.push({ name, ok, detail })
  const icon = ok ? "PASS" : "FAIL"
  console.log(`${icon} ${name}: ${detail}`)
}

async function requestJson(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 12000)
  const startedAt = performance.now()
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    })
    const text = await response.text()
    let body = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return { response, body, durationMs: Math.round(performance.now() - startedAt) }
  } finally {
    clearTimeout(timeout)
  }
}

async function checkBackendHealth() {
  const { response, body } = await requestJson(`${API_URL}/health`)
  const counts = body?.database?.counts || {}
  const dataReady = response.ok && body?.database?.status === "ready" && counts.transactions > 0
  record(
    "Backend health and workbook data",
    dataReady,
    dataReady
      ? `${counts.transactions} transactions, ${counts.hubs} hubs, ${counts.tprs} TPRs, ${counts.parts} parts`
      : `health=${response.status}, database=${body?.database?.status || "unknown"}`
  )
}

async function checkReadiness() {
  const { response, body } = await requestJson(`${API_URL}/settings/readiness`)
  const score = Number(body?.readiness_score || 0)
  const controls = body?.controls || []
  const passedControls = controls.filter((control) => control.status === "Pass").length
  record(
    "Production readiness posture",
    response.ok && score >= 92 && passedControls >= 6,
    `${score}/100, ${passedControls}/${controls.length} controls passing`
  )
}

async function checkSecurityHeaders() {
  const { response, durationMs } = await requestJson(`${API_URL}/health`)
  const requiredHeaders = [
    "x-request-id",
    "x-content-type-options",
    "x-frame-options",
    "content-security-policy",
    "cross-origin-opener-policy",
    "permissions-policy",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-max-request-bytes",
  ]
  const missing = requiredHeaders.filter((header) => !response.headers.get(header))
  record(
    "API security headers",
    response.ok && missing.length === 0,
    missing.length === 0 ? `all required headers present, ${durationMs}ms` : `missing ${missing.join(", ")}`
  )
}

async function checkPredictionEvidence() {
  const payload = {
    origin_hub: "HUB-DEL",
    destination_hub: "HUB-BLR",
    priority: "P1",
    part_category: "Storage",
    flow_type: "Forward",
    quantity: 10,
    shipment_value: 5000,
    logistics_partner: "DHL Express",
  }
  const { response, body } = await requestJson(`${API_URL}/predictions/predict`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const factors = body?.contributing_factors || []
  record(
    "SLA prediction evidence",
    response.ok && factors.length >= 3 && Number(body?.delay_probability) > 0,
    `${factors.length} evidence drivers, risk=${body?.delay_probability ?? "n/a"}`
  )
}

async function checkEndpoint(name, path, validate, detail) {
  const { response, body, durationMs } = await requestJson(`${API_URL}${path}`)
  const ok = response.ok && validate(body)
  record(name, ok && durationMs < 5000, ok ? `${detail(body)}, ${durationMs}ms` : `status=${response.status}`)
}

async function checkIntelligenceEndpoints() {
  await checkEndpoint(
    "Network intelligence endpoint",
    "/network/overview",
    (body) => Array.isArray(body?.nodes) && body.nodes.length > 0 && Array.isArray(body?.links) && body.links.length > 0,
    (body) => `${body.nodes.length} nodes, ${body.links.length} links`
  )
  await checkEndpoint(
    "Route corridor intelligence endpoint",
    "/route-intelligence/corridors",
    (body) => Array.isArray(body) && body.length > 0,
    (body) => `${body.length} scored corridors`
  )
  await checkEndpoint(
    "Cost optimization endpoint",
    "/optimization/dashboard",
    (body) => Array.isArray(body?.recommendations) || Array.isArray(body?.opportunities),
    (body) => `${(body.recommendations || []).length} recommendations, ${(body.opportunities || []).length} opportunities`
  )
  await checkEndpoint(
    "Reverse logistics endpoint",
    "/optimization/reverse",
    (body) => Array.isArray(body?.recommendations) || Array.isArray(body?.opportunities),
    (body) => `${(body.recommendations || []).length} recommendations, ${(body.opportunities || []).length} opportunities`
  )
  await checkEndpoint(
    "Carbon intelligence endpoint",
    "/twin/carbon",
    (body) => Number(body?.total_co2_kg || 0) > 0,
    (body) => `${Math.round(body.total_co2_kg)} kg CO2 baseline`
  )
}

async function checkChallengeCoverage() {
  await checkEndpoint(
    "Challenge route efficiency proof",
    "/challenge/route-efficiency",
    (body) => Array.isArray(body?.top_10_expensive_corridors) && body.top_10_expensive_corridors.length > 0 && Array.isArray(body?.hub_utilization_heatmap),
    (body) => `${body.top_10_expensive_corridors.length} expensive corridors, ${body.hub_utilization_heatmap.length} hub utilization rows`
  )
  await checkEndpoint(
    "Challenge cost what-if proof",
    "/challenge/cost-what-if",
    (body) => Number(body?.total_potential_saving || 0) > 0 && Array.isArray(body?.suboptimal_transactions),
    (body) => `${Math.round(body.total_potential_saving)} USD savings, ${body.suboptimal_transactions.length} suboptimal transactions`
  )
  await checkEndpoint(
    "Challenge reverse logistics proof",
    "/challenge/reverse-proof",
    (body) => Array.isArray(body?.tpr_utilization) && body.tpr_utilization.length > 0 && Array.isArray(body?.restock_alerts),
    (body) => `${body.tpr_utilization.length} TPR rows, ${body.restock_alerts.length} restock alerts`
  )
  await checkEndpoint(
    "Challenge model evaluation proof",
    "/challenge/model-evaluation",
    (body) => Number(body?.rows_evaluated || 0) > 0 && Number(body?.accuracy || 0) > 0,
    (body) => `${body.rows_evaluated} rows, accuracy=${Math.round(body.accuracy * 100)}%`
  )

  const { response, body, durationMs } = await requestJson(`${API_URL}/challenge/bonus-suite`, {
    method: "POST",
    body: JSON.stringify({ disabled_hubs: ["HUB-DEL"], priority: "P1", optimization_goal: "balanced" }),
    timeoutMs: 20000,
  })
  const bonusOk =
    response.ok &&
    Array.isArray(body?.carbon_optimization?.carbon_optimized_routes) &&
    body.carbon_optimization.carbon_optimized_routes.length > 0 &&
    Array.isArray(body?.multi_objective_pareto?.frontier) &&
    body.multi_objective_pareto.frontier.length > 0
  record(
    "Bonus challenge proof suite",
    bonusOk && durationMs < 8000,
    bonusOk
      ? `${body.carbon_optimization.carbon_optimized_routes.length} carbon routes, ${body.multi_objective_pareto.frontier.length} Pareto points, ${durationMs}ms`
      : `status=${response.status}`
  )
}

async function checkNaturalLanguageAnalytics() {
  const { response, body, durationMs } = await requestJson(
    `${API_URL}/analytics-query/query?q=${encodeURIComponent("Which hub has the most SLA breaches for Storage parts?")}`,
    { timeoutMs: 12000 }
  )
  const ok = response.ok && (Array.isArray(body?.data) || body?.answer || body?.summary)
  record(
    "Natural language analytics proof",
    ok && durationMs < 5000,
    ok ? `query answered in ${durationMs}ms` : `status=${response.status}`
  )
}

async function checkRoute(path) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 18000)
  const startedAt = performance.now()
  try {
    const response = await fetch(`${FRONTEND_URL}${path}`, { signal: controller.signal })
    const durationMs = Math.round(performance.now() - startedAt)
    record(`Frontend route ${path}`, response.ok && durationMs < 12000, `status=${response.status}, ${durationMs}ms`)
  } finally {
    clearTimeout(timeout)
  }
}

async function checkCoreReports() {
  const routes = [
    "/dashboard",
    "/network",
    "/operations",
    "/recommendations",
    "/route-intelligence",
    "/optimization",
    "/predictions/dashboard",
    "/reports",
    "/settings",
  ]
  for (const route of routes) {
    await checkRoute(route)
  }
}

async function run() {
  console.log(`Sanchar AI production smoke validation`)
  console.log(`Frontend: ${FRONTEND_URL}`)
  console.log(`Backend:  ${API_URL}`)
  console.log("")

  try {
    await checkBackendHealth()
    await checkReadiness()
    await checkSecurityHeaders()
    await checkPredictionEvidence()
    await checkIntelligenceEndpoints()
    await checkChallengeCoverage()
    await checkNaturalLanguageAnalytics()
    await checkCoreReports()
  } catch (error) {
    record("Smoke runner", false, error?.message || String(error))
  }

  const failed = checks.filter((check) => !check.ok)
  console.log("")
  console.log(`Result: ${checks.length - failed.length}/${checks.length} checks passed`)
  if (failed.length > 0) {
    console.log("Failed checks:")
    failed.forEach((check) => console.log(`- ${check.name}: ${check.detail}`))
    process.exit(1)
  }
}

run()
