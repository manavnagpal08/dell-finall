import logging
import pandas as pd
from sqlalchemy.orm import Session
from backend.core.config import settings
from backend.database.connection import engine
from backend.database.base import Base
from backend.models.hub import Hub
from backend.models.tpr import TPR
from backend.models.part import Part
from backend.models.transaction import Transaction
from backend.services.data_validator import data_validator
from backend.services.data_cleaner import data_cleaner
from backend.schemas.dataset import IngestionReportSchema

logger = logging.getLogger(__name__)

class DataLoader:
    def load_dataset(self, db: Session, file_path: str) -> dict:
        """
        Main dataset loading orchestration.
        1. Validate excel sheets schema and constraints.
        2. Clean and structure the dataset.
        3. Clear existing database tables.
        4. Populate SQLite tables with clean, normalized data.
        Returns a dict matching IngestionReportSchema.
        """
        # Step 1: Validate Excel
        logger.info(f"Starting Excel validation for file: {file_path}")
        report_dict = data_validator.validate_excel(file_path)
        
        if report_dict["status"] == "FAIL":
            logger.error("Excel validation failed. Ingestion cancelled.")
            return report_dict

        # Step 2: Extract dataframes
        try:
            hub_df = pd.read_excel(file_path, sheet_name="Hub_Location_Master")
            tpr_df = pd.read_excel(file_path, sheet_name="TPR_Master")
            part_df = pd.read_excel(file_path, sheet_name="Parts_Master")
            tx_df = pd.read_excel(file_path, sheet_name="Logistics_Transactions")
        except Exception as e:
            logger.error(f"Error loading verified sheets: {str(e)}")
            report_dict["status"] = "FAIL"
            report_dict["message"] = f"Error reading sheets post-validation: {str(e)}"
            return report_dict

        # Step 3: Create Tables and Clean Existing Data
        logger.info("Recreating database tables and preparing database write.")
        try:
            # Create tables if not exist
            Base.metadata.create_all(bind=engine)
            
            # Clear existing data in correct FK order
            db.query(Transaction).delete()
            db.query(Hub).delete()
            db.query(TPR).delete()
            db.query(Part).delete()
            db.flush()
        except Exception as e:
            logger.error(f"Database reset failed: {str(e)}")
            db.rollback()
            report_dict["status"] = "FAIL"
            report_dict["message"] = f"Database preparation failed: {str(e)}"
            return report_dict

        # Step 4: Write Cleaned Data to Database
        try:
            # 4.1 Load Hubs
            hubs_to_insert = []
            for _, row in hub_df.iterrows():
                hub = Hub(
                    hub_id=data_cleaner.clean_string(row["Hub_ID"]),
                    hub_name=data_cleaner.clean_string(row["Hub_Name"]),
                    city=data_cleaner.clean_string(row["City"]),
                    country=data_cleaner.clean_string(row["Country"]),
                    latitude=data_cleaner.clean_float(row["Latitude"]),
                    longitude=data_cleaner.clean_float(row["Longitude"]),
                    hub_type=data_cleaner.clean_string(row["Hub_Type"]),
                    primary_region=data_cleaner.clean_string(row["Primary_Region"]),
                    inventory_capacity=data_cleaner.clean_int(row["Inventory_Capacity"]),
                    current_stock_level=data_cleaner.clean_int(row["Current_Stock_Level"]),
                    utilisation_pct=data_cleaner.clean_percentage(row["Utilisation_Pct"])
                )
                hubs_to_insert.append(hub)
            db.add_all(hubs_to_insert)
            
            # 4.2 Load TPRs
            tprs_to_insert = []
            for _, row in tpr_df.iterrows():
                tpr = TPR(
                    tpr_id=data_cleaner.clean_string(row["TPR_ID"]),
                    tpr_name=data_cleaner.clean_string(row["TPR_Name"]),
                    city=data_cleaner.clean_string(row["City"]),
                    country=data_cleaner.clean_string(row["Country"]),
                    latitude=data_cleaner.clean_float(row["Latitude"]),
                    longitude=data_cleaner.clean_float(row["Longitude"]),
                    repair_capacity_per_day=data_cleaner.clean_int(row["Repair_Capacity_Per_Day"]),
                    current_workload=data_cleaner.clean_int(row["Current_Workload"]),
                    sla_days=data_cleaner.clean_int(row["SLA_Days"]),
                    active_contracts=data_cleaner.clean_int(row["Active_Contracts"]),
                    specialisation=data_cleaner.clean_string(row["Specialisation"])
                )
                tprs_to_insert.append(tpr)
            db.add_all(tprs_to_insert)

            # 4.3 Load Parts
            parts_to_insert = []
            for _, row in part_df.iterrows():
                part = Part(
                    part_no=data_cleaner.clean_string(row["Part_No"]),
                    part_description=data_cleaner.clean_string(row["Part_Description"]),
                    category=data_cleaner.clean_string(row["Category"]),
                    unit_cost_usd=data_cleaner.clean_float(row["Unit_Cost_USD"]),
                    weight_kg=data_cleaner.clean_float(row["Weight_Kg"]),
                    volume_cm3=data_cleaner.clean_int(row["Volume_cm3"]),
                    lead_time_days=data_cleaner.clean_int(row["Lead_Time_Days"]),
                    min_stock_level=data_cleaner.clean_int(row["Min_Stock_Level"]),
                    reorder_quantity=data_cleaner.clean_int(row["Reorder_Quantity"]),
                    fragile=data_cleaner.clean_boolean(row["Fragile"]),
                    hazardous=data_cleaner.clean_boolean(row["Hazardous"])
                )
                parts_to_insert.append(part)
            db.add_all(parts_to_insert)
            
            # Flush parents to check keys
            db.flush()

            # 4.4 Load Transactions
            txs_to_insert = []
            for _, row in tx_df.iterrows():
                # Extract nullable values and map cleanly
                intermediate_hub = data_cleaner.clean_string(row["Intermediate_Hub"])
                tpr_id = data_cleaner.clean_string(row["TPR_ID"])
                
                # Check for "None" or placeholder string
                if intermediate_hub == "None" or not intermediate_hub:
                    intermediate_hub = None
                if tpr_id == "None" or not tpr_id:
                    tpr_id = None
                
                tx = Transaction(
                    transaction_id=data_cleaner.clean_string(row["Transaction_ID"]),
                    flow_type=data_cleaner.clean_flow_type(row["Flow_Type"]),
                    part_no=data_cleaner.clean_string(row["Part_No"]),
                    priority=data_cleaner.clean_string(row["Priority"]),
                    source_location=data_cleaner.clean_string(row["Source_Location"]),
                    origin_hub_id=data_cleaner.clean_string(row["Origin_Hub"]),
                    intermediate_hub_id=intermediate_hub,
                    tpr_id=tpr_id,
                    destination_location=data_cleaner.clean_string(row["Destination_Location"]),
                    logistics_partner=data_cleaner.clean_string(row["Logistics_Partner"]),
                    quantity=data_cleaner.clean_int(row["Quantity"]),
                    unit_cost_usd=data_cleaner.clean_float(row["Unit_Cost_USD"]),
                    parts_value_usd=data_cleaner.clean_float(row["Parts_Value_USD"]),
                    logistics_cost_per_unit_usd=data_cleaner.clean_float(row["Logistics_Cost_Per_Unit_USD"]),
                    logistics_cost_total_usd=data_cleaner.clean_float(row["Logistics_Cost_Total_USD"]),
                    total_cost_usd=data_cleaner.clean_float(row["Total_Cost_USD"]),
                    dispatch_date=data_cleaner.clean_date(row["Dispatch_Date"]),
                    hub1_arrival_date=data_cleaner.clean_date(row["Hub1_Arrival_Date"]),
                    hub2_arrival_date=data_cleaner.clean_date(row["Hub2_Arrival_Date"]),
                    tpr_arrival_date=data_cleaner.clean_date(row["TPR_Arrival_Date"]),
                    expected_delivery_date=data_cleaner.clean_date(row["Expected_Delivery_Date"]),
                    actual_delivery_date=data_cleaner.clean_date(row["Actual_Delivery_Date"]),
                    transit_days_actual=data_cleaner.clean_int(row["Transit_Days_Actual"]),
                    transit_days_expected=data_cleaner.clean_int(row["Transit_Days_Expected"]),
                    sla_breach=data_cleaner.clean_boolean(row["SLA_Breach"]),
                    stock_at_origin_hub=data_cleaner.clean_int(row["Stock_At_Origin_Hub"]),
                    stock_at_intermediate_hub=data_cleaner.clean_int(row["Stock_At_Intermediate_Hub"]) if pd.notna(row["Stock_At_Intermediate_Hub"]) else None,
                    stock_at_tpr=data_cleaner.clean_int(row["Stock_At_TPR"]) if pd.notna(row["Stock_At_TPR"]) else None,
                    tamper_flag=data_cleaner.clean_tamper_flag(row["Tamper_Flag"]),
                    status=data_cleaner.clean_string(row["Status"]),
                    qr_code_id=data_cleaner.clean_string(row["QR_Code_ID"]),
                    notes=data_cleaner.clean_string(row["Notes"])
                )
                txs_to_insert.append(tx)
                
            db.add_all(txs_to_insert)
            db.commit()
            
            logger.info("Successfully loaded database tables.")
            report_dict["database_populated"] = True
            report_dict["message"] = f"Ingestion successful. Processed {len(txs_to_insert)} transactions."
            
            # Sync to Supabase PostgreSQL via SDK
            try:
                if settings.SUPABASE_URL and "your-project" not in settings.SUPABASE_URL:
                    logger.info("Syncing datasets to Supabase PostgreSQL...")
                    from supabase import create_client
                    supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
                    
                    # Sync hubs
                    for hub in hubs_to_insert:
                        supabase_client.table("hubs").upsert({
                            "id": hub.hub_id,
                            "name": hub.hub_name,
                            "location": f"{hub.city}, {hub.country}",
                            "type": "Hub",
                            "capacity": hub.inventory_capacity,
                            "status": "active",
                            "latitude": hub.latitude,
                            "longitude": hub.longitude
                        }).execute()
                    
                    # Sync repair centers (tprs)
                    for tpr in tprs_to_insert:
                        supabase_client.table("repair_centers").upsert({
                            "id": tpr.tpr_id,
                            "name": tpr.tpr_name,
                            "location": f"{tpr.city}, {tpr.country}",
                            "throughput_capacity": tpr.repair_capacity_per_day,
                            "status": "active",
                            "latitude": tpr.latitude,
                            "longitude": tpr.longitude
                        }).execute()
                    
                    # Sync parts
                    for part in parts_to_insert:
                        supabase_client.table("parts").upsert({
                            "id": part.part_no,
                            "sku": part.part_no,
                            "name": part.part_description,
                            "category": part.category,
                            "unit_cost": part.unit_cost_usd
                        }).execute()
                    
                    # Sync shipments
                    for tx in txs_to_insert[:100]: # Sync first 100 for safety
                        supabase_client.table("shipments").upsert({
                            "id": tx.transaction_id,
                            "tracking_number": tx.transaction_id,
                            "origin_hub_id": tx.origin_hub_id,
                            "destination_hub_id": tx.intermediate_hub_id if tx.intermediate_hub_id else tx.origin_hub_id,
                            "status": "in_transit" if tx.status == "In Transit" else "delivered",
                            "carrier": tx.logistics_partner,
                            "cost": tx.logistics_cost_total_usd,
                            "eta": tx.expected_delivery_date.strftime("%Y-%m-%d %H:%M:%S") if tx.expected_delivery_date else None,
                            "actual_delivery_time": tx.actual_delivery_date.strftime("%Y-%m-%d %H:%M:%S") if tx.actual_delivery_date else None
                        }).execute()
                    
                    logger.info("Successfully completed Supabase dataset sync.")
            except Exception as se:
                logger.warning(f"Supabase dataset sync failed: {str(se)}")
                report_dict["message"] += f" (Supabase sync alert: {str(se)})"
            
        except Exception as e:
            logger.error(f"Ingestion database write transaction failed: {str(e)}")
            db.rollback()
            report_dict["status"] = "FAIL"
            report_dict["database_populated"] = False
            report_dict["message"] = f"Database write failed: {str(e)}"
            
        return report_dict

data_loader = DataLoader()
