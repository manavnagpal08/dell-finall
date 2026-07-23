import logging
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Any, List
from supabase import create_client, Client
from backend.core.config import settings
from backend.database.connection import SessionLocal, engine
from backend.database.base import Base
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.models.transaction import Transaction

logger = logging.getLogger(__name__)

class IngestionPipeline:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_ANON_KEY
        self.supabase_client = None
        
        # Initialize Supabase client if configured
        if self.supabase_url and "your-project" not in self.supabase_url:
            try:
                self.supabase_client = create_client(self.supabase_url, self.supabase_key)
                logger.info("Supabase client initialized successfully for ingestion.")
            except Exception as e:
                logger.warning(f"Failed to initialize Supabase client: {str(e)}")

    def clean_nan(self, val: Any) -> Any:
        if pd.isna(val) or val is None:
            return None
        if isinstance(val, float) and np.isnan(val):
            return None
        return val

    def clean_str(self, val: Any) -> str:
        cleaned = self.clean_nan(val)
        if cleaned is None:
            return ""
        return str(cleaned).strip()

    def clean_float(self, val: Any) -> float:
        cleaned = self.clean_nan(val)
        if cleaned is None:
            return 0.0
        try:
            return float(cleaned)
        except:
            return 0.0

    def clean_int(self, val: Any) -> int:
        cleaned = self.clean_nan(val)
        if cleaned is None:
            return 0
        try:
            return int(cleaned)
        except:
            return 0

    def clean_date(self, val: Any) -> str:
        cleaned = self.clean_nan(val)
        if cleaned is None:
            return None
        if isinstance(cleaned, (datetime, pd.Timestamp)):
            return cleaned.strftime("%Y-%m-%d %H:%M:%S")
        try:
            ts = pd.to_datetime(cleaned)
            if pd.notna(ts):
                return ts.strftime("%Y-%m-%d %H:%M:%S")
        except:
            pass
        return None

    def run_ingestion(self, file_path: str = None) -> Dict[str, Any]:
        """
        Executes raw excel workbook ingestion and uploads records to local SQL and Supabase.
        """
        path = file_path or settings.DEFAULT_DATASET_PATH
        logger.info(f"Triggering ingestion pipeline for: {path}")
        
        report = {
            "status": "PASS",
            "message": "Ingestion completed successfully.",
            "rows_processed": {},
            "errors": []
        }

        # 1. Load Excel File
        try:
            xl = pd.ExcelFile(path)
        except Exception as e:
            report["status"] = "FAIL"
            report["message"] = f"Failed to load Excel file: {str(e)}"
            return report

        # Validate required sheets
        required_sheets = ["Hub_Location_Master", "TPR_Master", "Parts_Master", "Logistics_Transactions"]
        for s in required_sheets:
            if s not in xl.sheet_names:
                report["status"] = "FAIL"
                report["errors"].append(f"Missing required sheet: {s}")
        
        if report["status"] == "FAIL":
            report["message"] = "Workbook structure validation failed."
            return report

        # Load sheets
        hubs_df = xl.parse("Hub_Location_Master")
        tpr_df = xl.parse("TPR_Master")
        parts_df = xl.parse("Parts_Master")
        tx_df = xl.parse("Logistics_Transactions")

        # Cleanup duplicate rows
        hubs_df.drop_duplicates(subset=["Hub_ID"], inplace=True)
        tpr_df.drop_duplicates(subset=["TPR_ID"], inplace=True)
        parts_df.drop_duplicates(subset=["Part_No"], inplace=True)
        tx_df.drop_duplicates(subset=["Transaction_ID"], inplace=True)

        report["rows_processed"] = {
            "hubs": len(hubs_df),
            "repair_centers": len(tpr_df),
            "parts": len(parts_df),
            "transactions": len(tx_df)
        }

        # 2. Local Database Insertion (SQLite)
        db = SessionLocal()
        try:
            # Re-create SQLite tables
            Base.metadata.create_all(bind=engine)
            
            # Clear old records
            db.query(Transaction).delete()
            db.query(Hub).delete()
            db.query(TPR).delete()
            db.query(Part).delete()
            db.commit()

            # Insert Hubs
            for _, row in hubs_df.iterrows():
                hub = Hub(
                    hub_id=self.clean_str(row["Hub_ID"]),
                    hub_name=self.clean_str(row["Hub_Name"]),
                    city=self.clean_str(row["City"]),
                    country=self.clean_str(row["Country"]),
                    latitude=self.clean_float(row["Latitude"]),
                    longitude=self.clean_float(row["Longitude"]),
                    hub_type=self.clean_str(row["Hub_Type"]),
                    primary_region=self.clean_str(row["Primary_Region"]),
                    inventory_capacity=self.clean_int(row["Inventory_Capacity"]),
                    current_stock_level=self.clean_int(row["Current_Stock_Level"]),
                    utilisation_pct=self.clean_float(row["Utilisation_Pct"])
                )
                db.add(hub)

            # Insert TPRs
            for _, row in tpr_df.iterrows():
                tpr = TPR(
                    tpr_id=self.clean_str(row["TPR_ID"]),
                    tpr_name=self.clean_str(row["TPR_Name"]),
                    city=self.clean_str(row["City"]),
                    country=self.clean_str(row["Country"]),
                    latitude=self.clean_float(row["Latitude"]),
                    longitude=self.clean_float(row["Longitude"]),
                    repair_capacity_per_day=self.clean_int(row["Repair_Capacity_Per_Day"]),
                    current_workload=self.clean_int(row["Current_Workload"]),
                    sla_days=self.clean_int(row["SLA_Days"]),
                    active_contracts=self.clean_int(row["Active_Contracts"]),
                    specialisation=self.clean_str(row["Specialisation"])
                )
                db.add(tpr)

            # Insert Parts
            for _, row in parts_df.iterrows():
                part = Part(
                    part_no=self.clean_str(row["Part_No"]),
                    part_description=self.clean_str(row["Part_Description"]),
                    category=self.clean_str(row["Category"]),
                    unit_cost_usd=self.clean_float(row["Unit_Cost_USD"]),
                    weight_kg=self.clean_float(row["Weight_Kg"]),
                    volume_cm3=self.clean_float(row["Volume_cm3"]),
                    lead_time_days=self.clean_int(row["Lead_Time_Days"]),
                    min_stock_level=self.clean_int(row["Min_Stock_Level"]),
                    reorder_quantity=self.clean_int(row["Reorder_Quantity"]),
                    fragile=self.clean_int(row["Fragile"]) == 1 or str(row["Fragile"]).upper() == "TRUE",
                    hazardous=self.clean_int(row["Hazardous"]) == 1 or str(row["Hazardous"]).upper() == "TRUE"
                )
                db.add(part)

            db.commit()
            logger.info("Local SQLite database loaded and synced successfully.")
        except Exception as e:
            db.rollback()
            report["status"] = "FAIL"
            report["message"] = f"Local DB Ingestion failure: {str(e)}"
            logger.error(f"Local SQL insertion error: {str(e)}")
            return report
        finally:
            db.close()

        # 3. Supabase Sync Engine
        if self.supabase_client:
            logger.info("Syncing data records to Supabase tables...")
            try:
                # Sync Hubs
                for _, row in hubs_df.iterrows():
                    self.supabase_client.table("hubs").upsert({
                        "id": self.clean_str(row["Hub_ID"]),
                        "name": self.clean_str(row["Hub_Name"]),
                        "location": f"{self.clean_str(row['City'])}, {self.clean_str(row['Country'])}",
                        "type": "Hub",
                        "capacity": self.clean_int(row["Inventory_Capacity"]),
                        "status": "active",
                        "latitude": self.clean_float(row["Latitude"]),
                        "longitude": self.clean_float(row["Longitude"])
                    }).execute()

                # Sync Repair Centers
                for _, row in tpr_df.iterrows():
                    self.supabase_client.table("repair_centers").upsert({
                        "id": self.clean_str(row["TPR_ID"]),
                        "name": self.clean_str(row["TPR_Name"]),
                        "location": f"{self.clean_str(row['City'])}, {self.clean_str(row['Country'])}",
                        "throughput_capacity": self.clean_int(row["Repair_Capacity_Per_Day"]),
                        "status": "active",
                        "latitude": self.clean_float(row["Latitude"]),
                        "longitude": self.clean_float(row["Longitude"])
                    }).execute()

                # Sync Parts
                for _, row in parts_df.iterrows():
                    self.supabase_client.table("parts").upsert({
                        "id": self.clean_str(row["Part_No"]),
                        "sku": self.clean_str(row["Part_No"]),
                        "name": self.clean_str(row["Part_Description"]),
                        "category": self.clean_str(row["Category"]),
                        "unit_cost": self.clean_float(row["Unit_Cost_USD"])
                    }).execute()

                # Sync Shipments
                for _, row in tx_df.head(100).iterrows(): # Sync a subset of transactions to prevent network overload
                    self.supabase_client.table("shipments").upsert({
                        "id": self.clean_str(row["Transaction_ID"]),
                        "tracking_number": self.clean_str(row["Transaction_ID"]),
                        "origin_hub_id": self.clean_str(row["Origin_Hub"]),
                        "destination_hub_id": self.clean_str(row["Intermediate_Hub"]) if self.clean_str(row["Intermediate_Hub"]) else None,
                        "status": "in_transit" if self.clean_str(row["Status"]) == "In Transit" else "delivered",
                        "carrier": self.clean_str(row["Logistics_Partner"]),
                        "cost": self.clean_float(row["Logistics_Cost_Total_USD"]),
                        "eta": self.clean_date(row["Expected_Delivery_Date"]),
                        "actual_delivery_time": self.clean_date(row["Actual_Delivery_Date"])
                    }).execute()

                logger.info("Supabase sync finished successfully.")
            except Exception as e:
                logger.warning(f"Supabase sync warning (RLS policy constraints might apply): {str(e)}")
                # Do not fail ingestion if Supabase blocks updates, since local SQLite is fully working and offline-enabled
                report["message"] += f" (Supabase sync alert: {str(e)})"

        return report

ingestion_pipeline = IngestionPipeline()
