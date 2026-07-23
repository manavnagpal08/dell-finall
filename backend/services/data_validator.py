import pandas as pd
import numpy as np
from datetime import datetime
from typing import Tuple, Dict, Any, List
from backend.schemas.dataset import ValidationIssue

class DataValidator:
    REQUIRED_SHEETS = [
        "Logistics_Transactions",
        "Hub_Location_Master",
        "TPR_Master",
        "Parts_Master"
    ]

    EXPECTED_COLUMNS = {
        "Logistics_Transactions": [
            "Transaction_ID", "Flow_Type", "Part_No", "Part_Description", "Category", 
            "Priority", "Source_Location", "Origin_Hub", "Origin_Hub_Name", "Origin_Hub_City", 
            "Origin_Hub_Country", "Origin_Lat", "Origin_Lon", "Origin_Hub_Type", 
            "Intermediate_Hub", "Intermediate_Hub_Name", "Intermediate_City", 
            "Intermediate_Lat", "Intermediate_Lon", "TPR_ID", "TPR_Name", "TPR_City", 
            "TPR_Country", "TPR_Lat", "TPR_Lon", "Destination_Location", "Logistics_Partner", 
            "Quantity", "Unit_Cost_USD", "Parts_Value_USD", "Logistics_Cost_Per_Unit_USD", 
            "Logistics_Cost_Total_USD", "Total_Cost_USD", "Dispatch_Date", "Hub1_Arrival_Date", 
            "Hub2_Arrival_Date", "TPR_Arrival_Date", "Expected_Delivery_Date", 
            "Actual_Delivery_Date", "Transit_Days_Actual", "Transit_Days_Expected", 
            "SLA_Breach", "Stock_At_Origin_Hub", "Stock_At_Intermediate_Hub", 
            "Stock_At_TPR", "Tamper_Flag", "Status", "QR_Code_ID", "Notes"
        ],
        "Hub_Location_Master": [
            "Hub_ID", "Hub_Name", "City", "Country", "Latitude", "Longitude", 
            "Hub_Type", "Primary_Region", "Inventory_Capacity", "Current_Stock_Level", 
            "Utilisation_Pct"
        ],
        "TPR_Master": [
            "TPR_ID", "TPR_Name", "City", "Country", "Latitude", "Longitude", 
            "Repair_Capacity_Per_Day", "Current_Workload", "SLA_Days", 
            "Active_Contracts", "Specialisation"
        ],
        "Parts_Master": [
            "Part_No", "Part_Description", "Category", "Unit_Cost_USD", "Weight_Kg", 
            "Volume_cm3", "Lead_Time_Days", "Min_Stock_Level", "Reorder_Quantity", 
            "Fragile", "Hazardous"
        ]
    }

    def validate_excel(self, file_path: str) -> Dict[str, Any]:
        """
        Validate the complete Excel workbook structure and data constraints.
        Returns a dictionary matching IngestionReportSchema.
        """
        issues: List[ValidationIssue] = []
        rows_processed = {}
        sheets_checked = []
        
        # 1. Load Excel File
        try:
            xl = pd.ExcelFile(file_path)
            sheets_checked = xl.sheet_names
        except Exception as e:
            return {
                "status": "FAIL",
                "sheets_checked": [],
                "rows_processed": {},
                "issues": [
                    ValidationIssue(
                        sheet="None", 
                        row_index=0, 
                        column="Workbook", 
                        issue=f"Failed to read Excel file: {str(e)}", 
                        severity="ERROR"
                    )
                ],
                "database_populated": False,
                "message": "Workbook loading failed."
            }

        # 2. Check Required Sheets
        missing_sheets = [s for s in self.REQUIRED_SHEETS if s not in sheets_checked]
        if missing_sheets:
            for ms in missing_sheets:
                issues.append(
                    ValidationIssue(
                        sheet="Workbook",
                        row_index=0,
                        column="Sheets",
                        issue=f"Missing required sheet: {ms}",
                        severity="ERROR"
                    )
                )
            return {
                "status": "FAIL",
                "sheets_checked": sheets_checked,
                "rows_processed": {},
                "issues": [issue.model_dump() for issue in issues],
                "database_populated": False,
                "message": "Required sheets are missing."
            }

        # Load dataframes
        dfs = {}
        for sheet in self.REQUIRED_SHEETS:
            try:
                # Keep original data strings/types
                dfs[sheet] = pd.read_excel(file_path, sheet_name=sheet)
                rows_processed[sheet] = len(dfs[sheet])
            except Exception as e:
                issues.append(
                    ValidationIssue(
                        sheet=sheet,
                        row_index=0,
                        column="Read",
                        issue=f"Failed to read sheet: {str(e)}",
                        severity="ERROR"
                    )
                )

        if issues:
            return {
                "status": "FAIL",
                "sheets_checked": sheets_checked,
                "rows_processed": rows_processed,
                "issues": [issue.model_dump() for issue in issues],
                "database_populated": False,
                "message": "Sheet loading failed."
            }

        # 3. Check columns
        for sheet in self.REQUIRED_SHEETS:
            df = dfs[sheet]
            expected_cols = self.EXPECTED_COLUMNS[sheet]
            missing_cols = [c for c in expected_cols if c not in df.columns]
            if missing_cols:
                for mc in missing_cols:
                    issues.append(
                        ValidationIssue(
                            sheet=sheet,
                            row_index=0,
                            column=mc,
                            issue=f"Missing expected column: {mc}",
                            severity="ERROR"
                        )
                    )

        # Stop if structural column errors exist
        if any(i.severity == "ERROR" for i in issues):
            return {
                "status": "FAIL",
                "sheets_checked": sheets_checked,
                "rows_processed": rows_processed,
                "issues": [issue.model_dump() for issue in issues],
                "database_populated": False,
                "message": "Schema column checks failed."
            }

        # 4. Content Validation
        # Hub location validation
        hub_df = dfs["Hub_Location_Master"]
        self._validate_keys(hub_df, "Hub_Location_Master", "Hub_ID", issues)
        self._validate_coordinates(hub_df, "Hub_Location_Master", "Latitude", "Longitude", issues)
        self._validate_non_negative(hub_df, "Hub_Location_Master", ["Inventory_Capacity", "Current_Stock_Level"], issues)
        self._validate_percentage(hub_df, "Hub_Location_Master", "Utilisation_Pct", issues)

        # TPR validation
        tpr_df = dfs["TPR_Master"]
        self._validate_keys(tpr_df, "TPR_Master", "TPR_ID", issues)
        self._validate_coordinates(tpr_df, "TPR_Master", "Latitude", "Longitude", issues)
        self._validate_non_negative(tpr_df, "TPR_Master", ["Repair_Capacity_Per_Day", "Current_Workload", "SLA_Days", "Active_Contracts"], issues)

        # Parts validation
        part_df = dfs["Parts_Master"]
        self._validate_keys(part_df, "Parts_Master", "Part_No", issues)
        self._validate_non_negative(part_df, "Parts_Master", ["Unit_Cost_USD", "Weight_Kg", "Volume_cm3", "Lead_Time_Days", "Min_Stock_Level", "Reorder_Quantity"], issues)
        self._validate_binary_yes_no(part_df, "Parts_Master", ["Fragile", "Hazardous"], issues)

        # Transactions validation
        tx_df = dfs["Logistics_Transactions"]
        self._validate_keys(tx_df, "Logistics_Transactions", "Transaction_ID", issues)
        self._validate_non_negative(tx_df, "Logistics_Transactions", [
            "Quantity", "Unit_Cost_USD", "Parts_Value_USD", 
            "Logistics_Cost_Per_Unit_USD", "Logistics_Cost_Total_USD", "Total_Cost_USD",
            "Transit_Days_Actual", "Transit_Days_Expected", "Stock_At_Origin_Hub"
        ], issues)
        
        # Verify nullable / intermediate columns if non-negative
        self._validate_non_negative(tx_df, "Logistics_Transactions", ["Stock_At_Intermediate_Hub", "Stock_At_TPR"], issues, allow_null=True)
        
        # Validate coordinates in transaction
        self._validate_coordinates(tx_df, "Logistics_Transactions", "Origin_Lat", "Origin_Lon", issues)
        self._validate_coordinates(tx_df, "Logistics_Transactions", "Intermediate_Lat", "Intermediate_Lon", issues)
        self._validate_coordinates(tx_df, "Logistics_Transactions", "TPR_Lat", "TPR_Lon", issues)

        # Validate dates chronological order
        self._validate_chronological_dates(tx_df, "Logistics_Transactions", issues)

        # 5. Relational Checks
        valid_part_ids = set(part_df["Part_No"].dropna())
        valid_hub_ids = set(hub_df["Hub_ID"].dropna())
        valid_tpr_ids = set(tpr_df["TPR_ID"].dropna())

        for idx, row in tx_df.iterrows():
            # Check Part
            if row["Part_No"] not in valid_part_ids:
                issues.append(
                    ValidationIssue(
                        sheet="Logistics_Transactions",
                        row_index=int(idx) + 2,
                        column="Part_No",
                        issue=f"Part_No '{row['Part_No']}' does not exist in Parts_Master",
                        severity="ERROR"
                    )
                )
            # Check Origin Hub
            if row["Origin_Hub"] not in valid_hub_ids:
                issues.append(
                    ValidationIssue(
                        sheet="Logistics_Transactions",
                        row_index=int(idx) + 2,
                        column="Origin_Hub",
                        issue=f"Origin_Hub '{row['Origin_Hub']}' does not exist in Hub_Location_Master",
                        severity="ERROR"
                    )
                )
            # Check Intermediate Hub (if not empty/None)
            if pd.notna(row["Intermediate_Hub"]) and str(row["Intermediate_Hub"]).strip() != "" and row["Intermediate_Hub"] != "None":
                if row["Intermediate_Hub"] not in valid_hub_ids:
                    issues.append(
                        ValidationIssue(
                            sheet="Logistics_Transactions",
                            row_index=int(idx) + 2,
                            column="Intermediate_Hub",
                            issue=f"Intermediate_Hub '{row['Intermediate_Hub']}' does not exist in Hub_Location_Master",
                            severity="ERROR"
                        )
                    )
            # Check TPR_ID
            if pd.notna(row["TPR_ID"]) and str(row["TPR_ID"]).strip() != "" and row["TPR_ID"] != "None":
                if row["TPR_ID"] not in valid_tpr_ids:
                    issues.append(
                        ValidationIssue(
                            sheet="Logistics_Transactions",
                            row_index=int(idx) + 2,
                            column="TPR_ID",
                            issue=f"TPR_ID '{row['TPR_ID']}' does not exist in TPR_Master",
                            severity="ERROR"
                        )
                    )

        # Status determination
        has_errors = any(i.severity == "ERROR" for i in issues)
        status = "FAIL" if has_errors else "PASS"

        return {
            "status": status,
            "sheets_checked": sheets_checked,
            "rows_processed": rows_processed,
            "issues": [issue.model_dump() for issue in issues],
            "database_populated": False,
            "message": "Data validation completed." if status == "PASS" else "Data validation failed with errors."
        }

    # Helpers
    def _validate_keys(self, df: pd.DataFrame, sheet: str, key_col: str, issues: List[ValidationIssue]):
        # Null check
        null_mask = df[key_col].isnull()
        if null_mask.any():
            for idx in df[null_mask].index:
                issues.append(
                    ValidationIssue(
                        sheet=sheet,
                        row_index=int(idx) + 2,
                        column=key_col,
                        issue=f"Primary key {key_col} cannot be null",
                        severity="ERROR"
                    )
                )
        # Duplicate check
        dups = df[df[key_col].duplicated() & df[key_col].notnull()]
        if not dups.empty:
            for idx, val in dups[key_col].items():
                issues.append(
                    ValidationIssue(
                        sheet=sheet,
                        row_index=int(idx) + 2,
                        column=key_col,
                        issue=f"Duplicate primary key {key_col} found: '{val}'",
                        severity="ERROR"
                    )
                )

    def _validate_coordinates(self, df: pd.DataFrame, sheet: str, lat_col: str, lon_col: str, issues: List[ValidationIssue]):
        for col, is_lat in [(lat_col, True), (lon_col, False)]:
            if col not in df.columns:
                continue
            
            # Filter non-null
            valid_vals = df[df[col].notnull()]
            for idx, val in valid_vals[col].items():
                try:
                    num_val = float(val)
                    if is_lat and (num_val < -90 or num_val > 90):
                        issues.append(
                            ValidationIssue(
                                sheet=sheet,
                                row_index=int(idx) + 2,
                                column=col,
                                issue=f"Latitude {num_val} out of range [-90, 90]",
                                severity="ERROR"
                            )
                        )
                    elif not is_lat and (num_val < -180 or num_val > 180):
                        issues.append(
                            ValidationIssue(
                                sheet=sheet,
                                row_index=int(idx) + 2,
                                column=col,
                                issue=f"Longitude {num_val} out of range [-180, 180]",
                                severity="ERROR"
                            )
                        )
                except (ValueError, TypeError):
                    issues.append(
                        ValidationIssue(
                            sheet=sheet,
                            row_index=int(idx) + 2,
                            column=col,
                            issue=f"Invalid numeric format for coordinate: '{val}'",
                            severity="ERROR"
                        )
                    )

    def _validate_non_negative(self, df: pd.DataFrame, sheet: str, cols: List[str], issues: List[ValidationIssue], allow_null: bool = False):
        for col in cols:
            if col not in df.columns:
                continue
            
            # Select values
            val_series = df[col]
            if allow_null:
                val_series = val_series.dropna()
                # Skip placeholder string checks
                val_series = val_series[val_series != "None"]
                val_series = val_series[val_series != "N/A"]
            else:
                # If not allowed null, report nulls as errors
                null_mask = df[col].isnull()
                if null_mask.any():
                    for idx in df[null_mask].index:
                        issues.append(
                            ValidationIssue(
                                    sheet=sheet,
                                    row_index=int(idx) + 2,
                                    column=col,
                                    issue=f"Value in {col} cannot be null",
                                    severity="ERROR"
                                )
                            )
                    
            for idx, val in val_series.items():
                try:
                    num_val = float(val)
                    if num_val < 0:
                        issues.append(
                            ValidationIssue(
                                sheet=sheet,
                                row_index=int(idx) + 2,
                                column=col,
                                issue=f"Negative value {num_val} not allowed in '{col}'",
                                severity="ERROR"
                            )
                        )
                except (ValueError, TypeError):
                    issues.append(
                        ValidationIssue(
                            sheet=sheet,
                            row_index=int(idx) + 2,
                            column=col,
                            issue=f"Invalid numeric format in '{col}': '{val}'",
                            severity="ERROR"
                        )
                    )

    def _validate_percentage(self, df: pd.DataFrame, sheet: str, col: str, issues: List[ValidationIssue]):
        if col not in df.columns:
            return
        
        valid_vals = df[df[col].notnull()]
        for idx, val in valid_vals[col].items():
            try:
                num_val = float(val)
                if num_val < 0 or num_val > 1:
                    # Issue a warning instead of error if percentage is expressed like 0-100 instead of 0-1
                    if num_val > 1 and num_val <= 100:
                        issues.append(
                            ValidationIssue(
                                sheet=sheet,
                                row_index=int(idx) + 2,
                                column=col,
                                issue=f"Percentage expressed in 0-100 range: {num_val}%. Will be standardized to 0-1 range.",
                                severity="WARNING"
                            )
                        )
                    else:
                        issues.append(
                            ValidationIssue(
                                sheet=sheet,
                                row_index=int(idx) + 2,
                                column=col,
                                issue=f"Percentage out of range [0, 1]: {num_val}",
                                severity="ERROR"
                            )
                        )
            except (ValueError, TypeError):
                issues.append(
                    ValidationIssue(
                        sheet=sheet,
                        row_index=int(idx) + 2,
                        column=col,
                        issue=f"Invalid format for percentage in '{col}': '{val}'",
                        severity="ERROR"
                    )
                )

    def _validate_binary_yes_no(self, df: pd.DataFrame, sheet: str, cols: List[str], issues: List[ValidationIssue]):
        for col in cols:
            if col not in df.columns:
                continue
            
            valid_vals = df[df[col].notnull()]
            for idx, val in valid_vals[col].items():
                str_val = str(val).strip().upper()
                if str_val not in ["YES", "NO", "1", "0", "1.0", "0.0", "TRUE", "FALSE"]:
                    issues.append(
                        ValidationIssue(
                            sheet=sheet,
                            row_index=int(idx) + 2,
                            column=col,
                            issue=f"Invalid binary value in '{col}': '{val}' (expected YES/NO or True/False)",
                            severity="ERROR"
                        )
                    )

    def _validate_chronological_dates(self, df: pd.DataFrame, sheet: str, issues: List[ValidationIssue]):
        date_cols = ["Dispatch_Date", "Hub1_Arrival_Date", "Hub2_Arrival_Date", "TPR_Arrival_Date", "Expected_Delivery_Date", "Actual_Delivery_Date"]
        
        # Check parsing
        df_parsed = pd.DataFrame(index=df.index)
        for col in date_cols:
            if col not in df.columns:
                continue
            # Store parsed dates, coerce errors
            df_parsed[col] = pd.to_datetime(df[col], errors='coerce')
            
            # Report parse failures for non-null cells
            null_orig = df[col].isnull()
            null_parsed = df_parsed[col].isnull()
            parse_failed_idx = df.index[~null_orig & null_parsed]
            
            for idx in parse_failed_idx:
                raw_val = df.loc[idx, col]
                if str(raw_val).strip() != "" and str(raw_val).lower() != "none" and str(raw_val).lower() != "nan":
                    issues.append(
                        ValidationIssue(
                            sheet=sheet,
                            row_index=int(idx) + 2,
                            column=col,
                            issue=f"Could not parse date format: '{raw_val}'",
                            severity="ERROR"
                        )
                    )

        # Check chronology
        for idx in df.index:
            dispatch = df_parsed.loc[idx, "Dispatch_Date"]
            actual = df_parsed.loc[idx, "Actual_Delivery_Date"]
            
            if pd.notna(dispatch) and pd.notna(actual):
                if actual < dispatch:
                    issues.append(
                        ValidationIssue(
                            sheet=sheet,
                            row_index=int(idx) + 2,
                            column="Actual_Delivery_Date",
                            issue=f"Actual Delivery Date ({actual.date()}) is before Dispatch Date ({dispatch.date()})",
                            severity="ERROR"
                        )
                    )

data_validator = DataValidator()
