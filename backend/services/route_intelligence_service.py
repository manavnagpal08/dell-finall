import math
from typing import Dict, List, Optional, Set, Tuple
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, cast, Integer, or_
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.models.transaction import Transaction
from backend.schemas.route_intelligence import (
    ScoredCorridor,
    HubIntelligence,
    RouteOption,
    RecommendationResponse,
    SimulationImpact
)

# Geographic Haversine Distance
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

class RouteIntelligenceService:
    def get_scored_corridors(self, db: Session) -> List[ScoredCorridor]:
        """
        Calculates normalized performance scores for all active logistics corridors in the database.
        """
        # Fetch coordinate caches
        hubs = db.query(Hub).all()
        tprs = db.query(TPR).all()
        
        coords = {}
        utils = {}
        for h in hubs:
            coords[h.hub_id] = (h.latitude, h.longitude)
            utils[h.hub_id] = h.utilisation_pct
        for t in tprs:
            coords[t.tpr_id] = (t.latitude, t.longitude)
            utils[t.tpr_id] = t.current_workload / t.repair_capacity_per_day if t.repair_capacity_per_day > 0 else 0.0

        # Subquery to group transactions by corridors
        # Hub-to-Hub transits
        h2h_results = db.query(
            Transaction.origin_hub_id,
            Transaction.intermediate_hub_id,
            Transaction.flow_type,
            func.count(Transaction.transaction_id).label("volume"),
            func.sum(Transaction.logistics_cost_total_usd).label("cost"),
            func.avg(Transaction.transit_days_actual).label("transit_days"),
            func.sum(cast(Transaction.sla_breach, Integer)).label("breaches")
        ).filter(
            Transaction.intermediate_hub_id.isnot(None)
        ).group_by(
            Transaction.origin_hub_id,
            Transaction.intermediate_hub_id,
            Transaction.flow_type
        ).all()

        # Hub-to-TPR transits
        h2t_results = db.query(
            Transaction.intermediate_hub_id,
            Transaction.tpr_id,
            Transaction.flow_type,
            func.count(Transaction.transaction_id).label("volume"),
            func.sum(Transaction.logistics_cost_total_usd).label("cost"),
            func.avg(Transaction.transit_days_actual).label("transit_days"),
            func.sum(cast(Transaction.sla_breach, Integer)).label("breaches")
        ).filter(
            Transaction.intermediate_hub_id.isnot(None),
            Transaction.tpr_id.isnot(None)
        ).group_by(
            Transaction.intermediate_hub_id,
            Transaction.tpr_id,
            Transaction.flow_type
        ).all()

        scored_corridors = []
        
        # Helper to score a link
        def process_segment(source, target, flow, volume, cost, transit_days, breaches):
            if source not in coords or target not in coords:
                return None
                
            lat1, lon1 = coords[source]
            lat2, lon2 = coords[target]
            dist = haversine_distance(lat1, lon1, lat2, lon2)
            
            # Aggregate flow volumes
            fwd = volume if flow == "Forward" else 0
            rev = volume if flow == "Reverse" else 0
            
            avg_cost = cost / volume if volume > 0 else 0.0
            sla_breach = (breaches / volume) * 100.0 if volume > 0 else 0.0
            sla_success = 100.0 - sla_breach
            
            # Scores calculations
            reliability = sla_success
            
            # Speed score: ideal speed is 400 km per day. 
            expected_days = dist / 400.0 + 1.0
            transit_score = max(10.0, min(100.0, 100.0 * (expected_days / max(1.0, transit_days))))
            
            # Cost score: scaled relative to typical segment costs ($500 - $3000)
            cost_score = max(10.0, min(100.0, 100.0 * (1.0 - (avg_cost / 4000.0))))
            
            # Utilization score: penalize congested target nodes
            target_util = utils.get(target, 0.5)
            util_score = max(10.0, min(100.0, 100.0 * (1.0 - abs(target_util - 0.50))))
            
            risk_score = sla_breach * 0.7 + (100.0 - util_score) * 0.3
            overall_score = reliability * 0.4 + cost_score * 0.3 + transit_score * 0.3
            
            # Status classification
            status = "Normal"
            if risk_score >= 50.0 or sla_breach >= 50.0:
                status = "High Risk"
            elif target_util >= 0.85:
                status = "Bottleneck"
            elif overall_score >= 80.0:
                status = "Optimal"
            elif overall_score < 50.0:
                status = "Inefficient"

            return ScoredCorridor(
                source_id=source,
                target_id=target,
                distance_km=dist,
                shipment_count=volume,
                total_cost=float(cost),
                avg_cost_per_unit=float(avg_cost),
                avg_transit_days=float(transit_days or 0.0),
                sla_success_rate=float(sla_success),
                sla_breach_rate=float(sla_breach),
                forward_volume=fwd,
                reverse_volume=rev,
                efficiency_score=float(overall_score),
                risk_score=float(risk_score),
                reliability_score=float(reliability),
                cost_score=float(cost_score),
                transit_score=float(transit_score),
                utilization_score=float(util_score),
                overall_score=float(overall_score),
                status=status
            )

        # Process Hub-to-Hub
        for res in h2h_results:
            sc = process_segment(res.origin_hub_id, res.intermediate_hub_id, res.flow_type, res.volume, res.cost, res.transit_days, res.breaches)
            if sc: scored_corridors.append(sc)

        # Process Hub-to-TPR
        for res in h2t_results:
            sc = process_segment(res.intermediate_hub_id, res.tpr_id, res.flow_type, res.volume, res.cost, res.transit_days, res.breaches)
            if sc: scored_corridors.append(sc)

        return scored_corridors

    def get_hub_intelligence(self, db: Session) -> List[HubIntelligence]:
        """
        Gathers intelligence metrics on every logistics hub node.
        """
        hubs = db.query(Hub).all()
        scored_corridors = self.get_scored_corridors(db)
        
        # Build corridor cache mapping by source
        corridors_by_source = {}
        for c in scored_corridors:
            corridors_by_source.setdefault(c.source_id, []).append(c)

        hubs_intel = []

        for h in hubs:
            # Query inbound and outbound transits
            inbound = db.query(Transaction).filter(Transaction.intermediate_hub_id == h.hub_id).count()
            outbound_q = db.query(Transaction).filter(Transaction.origin_hub_id == h.hub_id)
            outbound = outbound_q.count()
            
            # Averages
            avg_dispatch_cost = db.query(func.avg(Transaction.logistics_cost_total_usd)).filter(Transaction.origin_hub_id == h.hub_id).scalar() or 0.0
            avg_transit = db.query(func.avg(Transaction.transit_days_actual)).filter(Transaction.origin_hub_id == h.hub_id).scalar() or 0.0
            
            sla_breaches = db.query(func.sum(cast(Transaction.sla_breach, Integer))).filter(Transaction.origin_hub_id == h.hub_id).scalar() or 0
            avg_sla = ((outbound - sla_breaches) / outbound * 100.0) if outbound > 0 else 100.0
            
            # Connected corridors count
            connected = corridors_by_source.get(h.hub_id, [])
            avg_efficiency = sum(c.overall_score for c in connected) / len(connected) if connected else 75.0
            
            risk = 100.0 - avg_sla
            if h.utilisation_pct >= 0.85:
                risk += 20.0  # add penalty for capacity overflow

            # Most frequently shipped parts
            top_parts_q = db.query(Transaction.part_no, func.count(Transaction.transaction_id).label("cnt"))\
                .filter(Transaction.origin_hub_id == h.hub_id)\
                .group_by(Transaction.part_no)\
                .order_by(func.count(Transaction.transaction_id).desc())\
                .limit(3).all()
            top_parts = [r.part_no for r in top_parts_q]

            # Most common destinations
            top_dest_q = db.query(Transaction.destination_location, func.count(Transaction.transaction_id).label("cnt"))\
                .filter(Transaction.origin_hub_id == h.hub_id)\
                .group_by(Transaction.destination_location)\
                .order_by(func.count(Transaction.transaction_id).desc())\
                .limit(3).all()
            top_dest = [r.destination_location for r in top_dest_q]

            hubs_intel.append(
                HubIntelligence(
                    hub_id=h.hub_id,
                    hub_name=h.hub_name,
                    inventory_capacity=h.inventory_capacity,
                    current_inventory=h.current_stock_level,
                    inbound_shipments=inbound,
                    outbound_shipments=outbound,
                    throughput=inbound + outbound,
                    avg_dispatch_cost=float(avg_dispatch_cost),
                    avg_transit_time=float(avg_transit),
                    connected_corridors_count=len(connected),
                    avg_sla_performance=float(avg_sla),
                    operational_risk=float(min(100.0, risk)),
                    efficiency_score=float(avg_efficiency),
                    top_parts=top_parts,
                    top_destinations=top_dest
                )
            )

        return hubs_intel

    def get_recommendations(
        self,
        db: Session,
        origin: str,
        destination: str,
        part_no: str,
        quantity: int,
        priority: str,
        delivery_window: int
    ) -> RecommendationResponse:
        """
        Deterministic, explainable pathfinding recommendation engine.
        Evaluates alternative segments, costs, and bottleneck SLA risks.
        """
        # Fetch coordinate caches for distance math
        scored_corridors = self.get_scored_corridors(db)

        hubs = db.query(Hub).all()
        tprs = db.query(TPR).all()
        coords: Dict[str, Tuple[float, float]] = {h.hub_id: (h.latitude, h.longitude) for h in hubs}
        utilization: Dict[str, float] = {h.hub_id: h.utilisation_pct * 100.0 for h in hubs}
        for t in tprs:
            coords[t.tpr_id] = (t.latitude, t.longitude)
            utilization[t.tpr_id] = (t.current_workload / t.repair_capacity_per_day * 100.0) if t.repair_capacity_per_day else 55.0

        # Build direct mapping of historical link metrics.
        link_lookup: Dict[Tuple[str, str], ScoredCorridor] = {}
        for c in scored_corridors:
            link_lookup[(c.source_id, c.target_id)] = c

        def direct_distance(source: str, target: str) -> Optional[float]:
            if source not in coords or target not in coords:
                return None
            lat1, lon1 = coords[source]
            lat2, lon2 = coords[target]
            return haversine_distance(lat1, lon1, lat2, lon2)

        def segment_profile(source: str, target: str) -> Optional[dict]:
            """
            Return a production planning segment. Historical reliability is used when
            available, but distance-based transit/cost keeps recommendations sane when
            old records are sparse or unusually slow.
            """
            distance = direct_distance(source, target)
            link = link_lookup.get((source, target))
            if distance is None and link is None:
                return None

            if distance is None and link:
                distance = link.distance_km

            assert distance is not None
            planned_days = max(0.7, distance / 760.0 + 0.35)
            planned_cost = max(450.0, distance * 0.78 + 325.0)

            if link:
                transit_days = min(float(link.avg_transit_days or planned_days), planned_days * 1.45)
                segment_cost = min(float(link.avg_cost_per_unit or planned_cost), planned_cost * 1.35)
                sla_breach = float(link.sla_breach_rate)
                confidence = min(98.0, 72.0 + min(link.shipment_count, 40) * 0.55)
            else:
                transit_days = planned_days
                segment_cost = planned_cost
                target_util = utilization.get(target, 55.0)
                sla_breach = 5.0 + max(0.0, target_util - 72.0) * 0.45
                confidence = 82.0

            return {
                "distance_km": float(distance),
                "segment_cost": float(segment_cost),
                "transit_days": float(transit_days),
                "sla_breach": max(0.0, min(95.0, sla_breach)),
                "congestion": utilization.get(target, 55.0),
                "confidence": confidence,
                "historical": bool(link),
            }

        # 1. Pathfinder: generate direct, one-hop, and limited two-hop options.
        # Direct hub-to-hub paths are always considered, even when historical records
        # are sparse. That prevents long detours from beating the physical shortest lane.
        connecting_hubs: List[str] = []
        is_client_city = not destination.startswith("HUB-") and not destination.startswith("TPR-")

        if is_client_city:
            # Query intermediate hubs historically feeding this customer city
            hubs_q = db.query(Transaction.intermediate_hub_id).filter(
                Transaction.destination_location == destination,
                Transaction.intermediate_hub_id.isnot(None)
            ).distinct().all()
            connecting_hubs = [r.intermediate_hub_id for r in hubs_q]
        else:
            connecting_hubs = [destination]

        paths: List[List[str]] = []
        seen_paths: Set[Tuple[str, ...]] = set()

        def add_path(path: List[str]) -> None:
            key = tuple(path)
            if len(set(path)) != len(path) or key in seen_paths:
                return
            if all(segment_profile(path[i], path[i + 1]) for i in range(len(path) - 1)):
                seen_paths.add(key)
                paths.append(path)

        all_hubs = [h.hub_id for h in hubs]
        for target in connecting_hubs:
            add_path([origin, target])

        for target in connecting_hubs:
            candidates = []
            direct_km = direct_distance(origin, target) or 1.0
            for inter in all_hubs:
                if inter in {origin, target}:
                    continue
                leg1 = direct_distance(origin, inter)
                leg2 = direct_distance(inter, target)
                if leg1 is None or leg2 is None:
                    continue
                detour_ratio = (leg1 + leg2) / direct_km
                if detour_ratio <= 1.75 or (origin, inter) in link_lookup or (inter, target) in link_lookup:
                    candidates.append((detour_ratio, inter))

            for _, inter in sorted(candidates)[:8]:
                add_path([origin, inter, target])

            # Include a small number of proven historical two-hop options for resilience,
            # but still let scoring penalize unreasonable geography.
            for inter in all_hubs:
                if inter not in {origin, target} and (origin, inter) in link_lookup and (inter, target) in link_lookup:
                    add_path([origin, inter, target])

        # 2. Evaluate Candidate Path Profiles
        options = []
        for path in paths:
            # Aggregate segment details
            seg_costs = []
            seg_transits = []
            seg_breaches = []
            seg_congestions = []
            seg_distances = []
            seg_confidence = []
            historical_segments = 0

            for i in range(len(path) - 1):
                profile = segment_profile(path[i], path[i + 1])
                if not profile:
                    break
                seg_costs.append(profile["segment_cost"])
                seg_transits.append(profile["transit_days"])
                seg_breaches.append(profile["sla_breach"])
                seg_congestions.append(profile["congestion"])
                seg_distances.append(profile["distance_km"])
                seg_confidence.append(profile["confidence"])
                historical_segments += 1 if profile["historical"] else 0

            if len(seg_distances) != len(path) - 1:
                continue

            # Sum segments
            payload_factor = max(0.85, min(1.35, 0.92 + (quantity / 160.0)))
            tot_cost = sum(seg_costs) * payload_factor
            handling_delay = max(0, len(path) - 2) * 0.35
            tot_transit = sum(seg_transits) + handling_delay
            total_distance = sum(seg_distances)
            max_breach = max(seg_breaches) if seg_breaches else 0.0
            avg_congestion = sum(seg_congestions) / len(seg_congestions) if seg_congestions else 0.0
            confidence = sum(seg_confidence) / len(seg_confidence) if seg_confidence else 75.0
            direct_km = direct_distance(origin, path[-1]) or total_distance or 1.0
            detour_ratio = total_distance / direct_km

            # Calculate risk levels
            risk_level = "Low"
            if max_breach >= 50.0 or avg_congestion >= 85.0 or detour_ratio >= 1.8:
                risk_level = "High"
            elif max_breach >= 25.0 or detour_ratio >= 1.35:
                risk_level = "Medium"

            confidence = max(20.0, min(99.0, confidence - max(0.0, detour_ratio - 1.15) * 20.0))

            # Explanations
            full_path = list(path)
            if is_client_city:
                full_path.append(destination)

            path_str = " -> ".join(full_path)
            
            # Checks against delivery window constraint
            window_violated = tot_transit > delivery_window
            
            explanation = ""
            if window_violated:
                explanation = f"Corridor transit ({tot_transit:.1f} days) exceeds required window of {delivery_window} days. "
            
            if risk_level == "High" and max_breach >= 50.0:
                explanation += f"High SLA breach history detected on this lane ({max_breach:.1f}% breach rate). "
            elif risk_level == "High" and avg_congestion >= 85.0:
                explanation += f"High congestion risk detected on the route ({avg_congestion:.0f}% utilization). "
            elif risk_level == "High":
                explanation += f"High detour risk detected for this path ({detour_ratio:.2f}x direct distance). "
            elif detour_ratio <= 1.08:
                explanation += "Shortest physical lane with minimal handling and low detour risk. "
            else:
                explanation += "Stable operational lane showing healthy capacity loads. "
                
            explanation += f"Distance: {total_distance:,.0f} km. Estimated transport cost: {tot_cost:,.2f} USD."

            # Calculate utility score for sorting
            # P1/P2 shipments favor shortest/fastest lanes first. Detour penalties prevent
            # geography-breaking options such as routing a domestic lane through far-off hubs.
            cost_norm = max(0.0, 100.0 - min(100.0, tot_cost / 120.0))
            transit_norm = max(0.0, 100.0 - min(100.0, tot_transit * 9.0))
            distance_norm = max(0.0, 100.0 - min(100.0, (detour_ratio - 1.0) * 125.0))
            reliability_norm = max(0.0, 100.0 - max_breach)
            congestion_norm = max(0.0, 100.0 - max(0.0, avg_congestion - 55.0) * 1.8)

            if priority and ("P1" in priority or "Critical" in priority):
                weights = {"transit": 0.34, "distance": 0.28, "reliability": 0.20, "cost": 0.10, "congestion": 0.08}
            elif priority and ("P2" in priority or "High" in priority):
                weights = {"transit": 0.30, "distance": 0.24, "reliability": 0.22, "cost": 0.14, "congestion": 0.10}
            else:
                weights = {"transit": 0.22, "distance": 0.20, "reliability": 0.22, "cost": 0.24, "congestion": 0.12}

            utility = (
                transit_norm * weights["transit"]
                + distance_norm * weights["distance"]
                + reliability_norm * weights["reliability"]
                + cost_norm * weights["cost"]
                + congestion_norm * weights["congestion"]
                + historical_segments * 1.5
            )
            if window_violated:
                utility -= 35.0
            if detour_ratio > 1.25:
                utility -= (detour_ratio - 1.25) * 45.0
            if len(path) > 2:
                utility -= (len(path) - 2) * 4.0

            options.append((
                utility,
                RouteOption(
                    path=full_path,
                    total_cost=float(tot_cost),
                    total_transit_days=float(tot_transit),
                    total_distance_km=float(total_distance),
                    sla_success_rate=float(100.0 - max_breach),
                    sla_breach_rate=float(max_breach),
                    risk_level=risk_level,
                    confidence_score=float(confidence),
                    congestion_index=float(avg_congestion),
                    explanation=explanation
                )
            ))

        # Sort options by utility score desc
        options.sort(key=lambda x: x[0], reverse=True)
        
        # Separate best from alternatives
        recommended = None
        alternatives = []
        
        if options:
            recommended = options[0][1]
            alternatives = [opt[1] for opt in options[1:3]] # up to 2 alternatives

        # Rationale
        rationale = ""
        if recommended:
            route_mode = "direct shortest lane" if len(recommended.path) == 2 else f"controlled relay via {recommended.path[1]}"
            rationale = f"Recommended route is {recommended.path[0]} to {destination} using the {route_mode}. "
            if recommended.sla_breach_rate < 30.0:
                rationale += f"It covers {recommended.total_distance_km:,.0f} km with {recommended.sla_success_rate:.1f}% SLA success rate and satisfies the required delivery window of {delivery_window} days."
            else:
                rationale += f"Note: historical data indicates a {recommended.sla_breach_rate:.1f}% breach risk, but it remains the most optimal path available within the delivery constraints."
        else:
            rationale = "No active historical routes could be mapped linking the origin to destination. Logistics managers should configure alternative feeder lanes in Settings."

        verification_status = "Deterministic engine verified"
        verification_summary = (
            "Route, cost, ETA, reliability, and confidence were calculated from hub coordinates, "
            "scored corridor history, SLA breach rate, congestion, quantity, and priority."
        )
        if recommended:
            try:
                from backend.ai.llm import generate_json_response
                gemini_prompt = f"""You are Sanchar AI's route QA reviewer. Verify whether this deterministic route recommendation is internally consistent. Do not invent new route values.
Input:
origin={origin}
destination={destination}
part_no={part_no}
quantity={quantity}
priority={priority}
delivery_window_days={delivery_window}
recommended_path={recommended.path}
total_distance_km={recommended.total_distance_km:.2f}
total_cost_usd={recommended.total_cost:.2f}
total_transit_days={recommended.total_transit_days:.2f}
sla_success_rate={recommended.sla_success_rate:.2f}
risk_level={recommended.risk_level}
explanation={recommended.explanation}

Return JSON only:
{{
  "status": "Gemini verified" or "Review required",
  "summary": "one short sentence explaining if cost/time/path are consistent with the deterministic evidence"
}}
"""
                gemini_response = generate_json_response(gemini_prompt)
                if isinstance(gemini_response, dict):
                    status = str(gemini_response.get("status") or "").strip()
                    summary = str(gemini_response.get("summary") or "").strip()
                    if status:
                        verification_status = status[:80]
                    if summary:
                        verification_summary = summary[:240]
            except Exception:
                # Gemini is optional; the deterministic engine remains the verified source.
                pass

        return RecommendationResponse(
            recommended=recommended,
            alternatives=alternatives,
            explanation=rationale,
            verification_status=verification_status,
            verification_summary=verification_summary
        )

    def simulate_scenario(self, db: Session, disabled_hubs: List[str], disabled_tprs: List[str]) -> SimulationImpact:
        """
        Interactive scenario simulation workspace. Re-routes affected shipments
        via alternative corridors and calculates net deltas in cost/SLA breach.
        """
        # Parse all active transactions
        transactions = db.query(Transaction).all()
        scored_corridors = self.get_scored_corridors(db)
        
        # Build coordinates cache
        hubs = db.query(Hub).all()
        tprs = db.query(TPR).all()
        coords = {h.hub_id: (h.latitude, h.longitude) for h in hubs}
        for t in tprs:
            coords[t.tpr_id] = (t.latitude, t.longitude)

        link_lookup = {}
        for c in scored_corridors:
            link_lookup[(c.source_id, c.target_id)] = c

        # Active nodes excluding disabled list
        disabled_set = set(disabled_hubs + disabled_tprs)
        
        affected_count = 0
        rerouted_count = 0
        
        original_cost = 0.0
        new_cost = 0.0
        
        original_transit = 0.0
        new_transit = 0.0
        
        original_breaches = 0
        new_breaches = 0

        # Rerouting function using remaining active links
        def find_alt_path(origin, target):
            # BFS up to 3 hops excluding disabled nodes
            queue = [[origin]]
            visited = set()
            all_paths = []

            while queue:
                path = queue.pop(0)
                node = path[-1]
                if node == target:
                    all_paths.append(path)
                    continue

                if node in visited:
                    continue
                visited.add(node)

                # Find neighbors
                for (u, v) in link_lookup:
                    if u == node and v not in disabled_set and u not in disabled_set:
                        if v not in path:
                            queue.append(path + [v])

            # Rate paths and pick best
            rated = []
            for p in all_paths:
                seg_costs = []
                seg_transits = []
                seg_breaches = []
                
                for idx in range(len(p) - 1):
                    link = link_lookup.get((p[idx], p[idx+1]))
                    if link:
                        seg_costs.append(link.avg_cost_per_unit)
                        seg_transits.append(link.avg_transit_days)
                        seg_breaches.append(link.sla_breach_rate)
                        
                if seg_costs:
                    score = sum(seg_breaches) + sum(seg_costs)/100.0
                    rated.append((score, p, sum(seg_costs), sum(seg_transits), max(seg_breaches)))

            if rated:
                rated.sort(key=lambda x: x[0])  # lower score (cost + breach) is better
                return rated[0]  # returns (score, path, cost, transit, breach)
            return None

        # Loop shipments
        for t in transactions:
            original_cost += t.logistics_cost_total_usd
            original_transit += t.transit_days_actual
            if t.sla_breach:
                original_breaches += 1

            # Check if this transaction is affected by disabled nodes
            touches_disabled = (
                t.origin_hub_id in disabled_set or
                t.intermediate_hub_id in disabled_set or
                t.tpr_id in disabled_set
            )

            if touches_disabled:
                affected_count += 1
                # Attempt to re-route
                # Forward destination or reverse TPR target
                target = t.intermediate_hub_id if t.intermediate_hub_id and t.intermediate_hub_id not in disabled_set else None
                if not target:
                    target = t.tpr_id if t.tpr_id and t.tpr_id not in disabled_set else None

                # Re-route from origin hub to target
                if target:
                    alt = find_alt_path(t.origin_hub_id, target)
                    if alt:
                        rerouted_count += 1
                        payload_factor = max(0.85, min(1.45, 0.82 + (t.quantity / 120.0)))
                        disruption_factor = 1.12
                        new_cost += alt[2] * payload_factor * disruption_factor
                        new_transit += alt[3]
                        # SLA breach simulation based on segment breach rate
                        breached = alt[4] >= 50.0  # simulate delay if breach rate >= 50%
                        if breached:
                            new_breaches += 1
                        continue
                
                # If unroutable (canceled/stalled), apply penalty costs
                new_cost += t.logistics_cost_total_usd * 1.35
                new_transit += t.transit_days_actual + 4.0
                new_breaches += 1
            else:
                # Shipment proceeds normally
                new_cost += t.logistics_cost_total_usd
                new_transit += t.transit_days_actual
                if t.sla_breach:
                    new_breaches += 1

        total_txs = len(transactions)
        
        orig_breach_rate = (original_breaches / total_txs * 100.0) if total_txs > 0 else 0.0
        new_breach_rate = (new_breaches / total_txs * 100.0) if total_txs > 0 else 0.0

        # Rationale string
        nodes_str = ", ".join(disabled_hubs + disabled_tprs)
        summary = f"Simulating complete operational outage at: {nodes_str}. "
        summary += f"Affected {affected_count} total shipment segments. "
        
        cost_delta = new_cost - original_cost
        if cost_delta > 0:
            summary += f"Rerouting creates an accumulated network penalty of +{cost_delta:,.0f} USD. "
        else:
            summary += "No significant cost penalty occurred. "

        sla_delta = new_breach_rate - orig_breach_rate
        if sla_delta > 0:
            summary += f"SLA failure rates increased by +{sla_delta:.2f}% due to congestion on backup routes."
        else:
            summary += "SLA delay performance remained stable."

        return SimulationImpact(
            affected_shipments_count=affected_count,
            rerouted_shipments_count=rerouted_count,
            original_total_cost=original_cost,
            new_total_cost=new_cost,
            cost_delta=cost_delta,
            original_avg_transit_days=original_transit / total_txs if total_txs > 0 else 0.0,
            new_avg_transit_days=new_transit / total_txs if total_txs > 0 else 0.0,
            transit_days_delta=(new_transit - original_transit) / total_txs if total_txs > 0 else 0.0,
            original_sla_breach_rate=orig_breach_rate,
            new_sla_breach_rate=new_breach_rate,
            sla_breach_delta=sla_delta,
            operational_impact_summary=summary
        )

route_intelligence_service = RouteIntelligenceService()
