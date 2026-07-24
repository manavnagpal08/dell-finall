import math
import uuid
import logging
import urllib.request
import xml.etree.ElementTree as ET
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.schemas.risk import RiskEvent
from backend.models.hub import Hub
from backend.models.transaction import Transaction

logger = logging.getLogger(__name__)

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class RiskService:
    def _fetch_gdacs_events(self) -> List[dict]:
        url = "https://www.gdacs.org/xml/rss.xml"
        events = []
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                xml_data = response.read()
            
            root = ET.fromstring(xml_data)
            
            # Namespace map for GDACS
            namespaces = {
                'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
                'gdacs': 'http://www.gdacs.org'
            }
            
            for item in root.findall('./channel/item'):
                title = item.find('title').text if item.find('title') is not None else "Unknown Event"
                desc = item.find('description').text if item.find('description') is not None else ""
                
                lat_node = item.find('geo:Point/geo:lat', namespaces)
                lon_node = item.find('geo:Point/geo:long', namespaces)
                
                severity_node = item.find('gdacs:severity', namespaces)
                eventtype_node = item.find('gdacs:eventtype', namespaces)
                
                if lat_node is not None and lon_node is not None:
                    try:
                        lat = float(lat_node.text)
                        lon = float(lon_node.text)
                        
                        severity_val = severity_node.get('value') if severity_node is not None else ""
                        event_type = eventtype_node.text if eventtype_node is not None else "Alert"
                        
                        # Map severity
                        mapped_severity = "Low"
                        if severity_val and "Red" in severity_val:
                            mapped_severity = "Critical"
                        elif severity_val and "Orange" in severity_val:
                            mapped_severity = "High"
                        elif severity_val and "Green" in severity_val:
                            mapped_severity = "Medium"
                        
                        # Only track medium to critical
                        if mapped_severity in ["Critical", "High", "Medium"]:
                            # Typical disaster radius based on severity
                            radius = 200.0 if mapped_severity == "Medium" else 500.0
                            if mapped_severity == "Critical":
                                radius = 800.0
                                
                            events.append({
                                'title': title,
                                'desc': desc.split('<br')[0] if '<br' in desc else desc,
                                'lat': lat,
                                'lon': lon,
                                'severity': mapped_severity,
                                'type': event_type,
                                'radius': radius
                            })
                    except ValueError:
                        continue
                        
        except Exception as e:
            logger.error(f"Failed to fetch GDACS data: {e}")
            
        return events

    def get_realtime_risk_overlay(self, db: Session) -> List[RiskEvent]:
        # 1. Fetch real-time active disasters from GDACS
        raw_events = self._fetch_gdacs_events()
        
        # If GDACS is down or no events, return empty list
        if not raw_events:
            return []
            
        # 2. Get all hubs to check for intersections
        hubs = db.query(Hub).all()
        risk_events = []
        
        for event in raw_events:
            affected_hub_names = []
            affected_hub_ids = []
            
            # Find hubs within the disaster radius
            for hub in hubs:
                if hub.latitude and hub.longitude:
                    distance = haversine(event['lat'], event['lon'], hub.latitude, hub.longitude)
                    if distance <= event['radius']:
                        affected_hub_names.append(hub.hub_name)
                        affected_hub_ids.append(hub.hub_id)
            
            # If no hubs are affected by this disaster, we skip it to reduce noise
            if not affected_hub_names:
                continue
                
            # 3. Calculate affected shipments count
            shipments_count = 0
            if affected_hub_ids:
                shipments_count = db.query(func.count(Transaction.transaction_id)).filter(
                    Transaction.origin_hub_id.in_(affected_hub_ids),
                    Transaction.status.notin_(["Delivered", "Cancelled"])
                ).scalar() or 0
                
            # 4. Generate recommendation
            rec = "No immediate action required. Monitor situation closely."
            if event['severity'] == "Critical" and shipments_count > 0:
                rec = f"Preemptively dispatch {shipments_count} active shipments from {', '.join(affected_hub_names[:2])} via alternative routings immediately."
            elif event['severity'] == "High":
                rec = "Delay non-essential replenishments and alert carriers of potential ETA impacts."
                
            risk_events.append(RiskEvent(
                id=f"RISK-{uuid.uuid4().hex[:6].upper()}",
                title=event['title'],
                description=event['desc'],
                risk_type="Disaster",
                severity=event['severity'],
                latitude=event['lat'],
                longitude=event['lon'],
                radius_km=event['radius'],
                affected_hubs=affected_hub_names,
                affected_shipments_count=shipments_count,
                expected_impact_days=7 if event['severity'] == "Critical" else 3,
                recommended_action=rec
            ))
            
        # Sort by severity (Critical first)
        severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
        risk_events.sort(key=lambda x: severity_order.get(x.severity, 99))
        
        # Return top 5 most relevant risks to avoid cluttering map
        return risk_events[:5]

risk_service = RiskService()
