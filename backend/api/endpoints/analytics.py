from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.api.deps import get_db
from backend.ai.agents import OrchestratorAgent
from typing import Dict, Any, List

router = APIRouter()

# Single orchestrator instance
orchestrator = OrchestratorAgent()

# Helper to build filters dict
def get_filters_dict(
    flow_type: str = Query("all"),
    priority: str = Query("all"),
    part_category: str = Query("all")
) -> Dict[str, Any]:
    return {
        "flow_type": flow_type,
        "priority": priority,
        "part_category": part_category
    }

# ==================================================
# 1. GET /analytics/corridors
# ==================================================
@router.get("/corridors", response_model=dict)
def get_corridors(filters: dict = Depends(get_filters_dict)):
    """
    Returns the top 10 most expensive shipping corridors.
    """
    res = orchestrator.process_request("corridors", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return {
        "items": res["analysis"]["expensive_corridors"],
        "total": len(res["analysis"]["expensive_corridors"])
    }

# ==================================================
# 2. GET /analytics/hubs
# ==================================================
@router.get("/hubs", response_model=dict)
def get_hubs_analytics(filters: dict = Depends(get_filters_dict)):
    """
    Returns the hub utilization summary metrics.
    """
    res = orchestrator.process_request("hubs", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return {
        "items": res["analysis"]["hubs_summary"],
        "total": len(res["analysis"]["hubs_summary"])
    }

# ==================================================
# 3. GET /analytics/routes
# ==================================================
@router.get("/routes", response_model=dict)
def get_routes_analytics(filters: dict = Depends(get_filters_dict)):
    """
    Returns all routing pathways with efficiencies.
    """
    res = orchestrator.process_request("routes", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return {
        "items": res["analysis"]["expensive_corridors"],
        "total": len(res["analysis"]["expensive_corridors"])
    }

# ==================================================
# 4. GET /analytics/outliers
# ==================================================
@router.get("/outliers", response_model=dict)
def get_outliers(filters: dict = Depends(get_filters_dict)):
    """
    Detects cost and transit time outliers in shipments.
    """
    res = orchestrator.process_request("outliers", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    # Find corridors with SLA breach > 20% or Cost per km > 15
    outliers = [
        c for c in res["analysis"]["expensive_corridors"]
        if c["sla_breach_pct"] > 20.0 or c["cost_per_km"] > 15.0
    ]
    return {
        "items": outliers,
        "total": len(outliers)
    }

# ==================================================
# 5. GET /analytics/transit
# ==================================================
@router.get("/transit", response_model=dict)
def get_transit_analytics(filters: dict = Depends(get_filters_dict)):
    """
    Returns general transit delay averages.
    """
    res = orchestrator.process_request("transit", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return res["analysis"]["metrics"]

# ==================================================
# 6. GET /analytics/utilization
# ==================================================
@router.get("/utilization", response_model=dict)
def get_utilization_analytics(filters: dict = Depends(get_filters_dict)):
    """
    Returns overall storage capacities and utilization averages.
    """
    res = orchestrator.process_request("utilization", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return {
        "items": res["analysis"]["hubs_summary"]
    }

# ==================================================
# 7. GET /analytics/reasoning
# ==================================================
@router.get("/reasoning", response_model=dict)
def get_reasoning(
    type: str = Query(..., description="Object type (hub, route)"),
    id: str = Query(..., description="Object ID reference"),
    filters: dict = Depends(get_filters_dict)
):
    """
    Invokes the AI Reasoning Agent to generate structural explanations for an object.
    """
    res = orchestrator.process_request("reasoning", {
        "filters": filters,
        "selected_object": {"type": type, "id": id}
    })
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return res["reasoning"] or {}

# ==================================================
# 8. GET /analytics/network-scan
# ==================================================
@router.get("/network-scan", response_model=dict)
def get_network_scan(filters: dict = Depends(get_filters_dict)):
    """
    Triggers a full network bottleneck scanner across all nodes.
    """
    res = orchestrator.process_request("scan", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    
    # Compile scan issues ranked by priority
    issues = []
    
    # Check overloaded hubs
    for h in res["analysis"]["hubs_summary"]:
        if h["utilization_pct"] > 80.0:
            issues.append({
                "title": f"Hub Congestion at {h['name']}",
                "category": "Congestion",
                "severity": "Critical" if h["utilization_pct"] > 90.0 else "Warning",
                "impact": f"Dwell delays due to {h['utilization_pct']:.1f}% capacity utilization.",
                "recommendation": "Reroute intermediate part transits."
            })
            
    # Check expensive corridors
    for c in res["analysis"]["expensive_corridors"][:5]:
        if c["avg_cost_usd"] > 15000.0 or c["cost_per_km"] > 20.0:
            issues.append({
                "title": f"Elevated Corridor Cost: {c['origin_hub_id']} → {c['destination']}",
                "category": "Cost Corridor",
                "severity": "Critical" if c["cost_per_km"] > 30.0 else "Warning",
                "impact": f"Demurrage and spot-shipping premium of ${c['avg_cost_usd']:,.2f}.",
                "recommendation": "Consolidate into weekly sea runs."
            })

    return {
        "items": sorted(issues, key=lambda x: x["severity"] == "Critical", reverse=True),
        "total": len(issues)
    }

# ==================================================
# 9. GET /alerts/scan
# ==================================================
@router.get("/alerts/scan", response_model=dict)
def scan_alerts(filters: dict = Depends(get_filters_dict)):
    """
    Collects alert intelligence from the Alert Agent.
    """
    res = orchestrator.process_request("alerts", {"filters": filters})
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res["message"])
    return {
        "items": res["alerts"],
        "total": len(res["alerts"])
    }
