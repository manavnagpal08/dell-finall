import pandas as pd
from datetime import datetime
from typing import Any, Optional

class DataCleaner:
    @staticmethod
    def clean_string(val: Any) -> Optional[str]:
        """
        Cleans string columns: strips whitespace, replaces empty placeholders with None.
        """
        if pd.isna(val):
            return None
        s = str(val).strip()
        if s.lower() in ["", "none", "n/a", "null", "nan"]:
            return None
        return s

    @staticmethod
    def clean_boolean(val: Any) -> bool:
        """
        Standardises truth values to booleans.
        """
        if pd.isna(val):
            return False
        s = str(val).strip().upper()
        return s in ["YES", "1", "1.0", "TRUE", "Y"]

    @staticmethod
    def clean_float(val: Any) -> float:
        """
        Ensures a float returned, defaults to 0.0.
        """
        if pd.isna(val):
            return 0.0
        try:
            return float(val)
        except (ValueError, TypeError):
            return 0.0

    @staticmethod
    def clean_int(val: Any) -> int:
        """
        Ensures an integer is returned, defaults to 0.
        """
        if pd.isna(val):
            return 0
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0

    @staticmethod
    def clean_date(val: Any) -> Optional[datetime]:
        """
        Converts date value to datetime object.
        """
        if pd.isna(val):
            return None
        
        # If already a datetime or timestamp
        if isinstance(val, (datetime, pd.Timestamp)):
            # convert pd.Timestamp to datetime
            if hasattr(val, 'to_pydatetime'):
                return val.to_pydatetime()
            return val
            
        s = str(val).strip()
        if s.lower() in ["", "none", "n/a", "null", "nan"]:
            return None
            
        # Try common formats
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(s, fmt)
            except ValueError:
                continue
                
        # Coerce via pandas if standard parsing fails
        try:
            ts = pd.to_datetime(s)
            if pd.notna(ts):
                return ts.to_pydatetime()
        except Exception:
            pass
            
        return None

    @staticmethod
    def clean_percentage(val: Any) -> float:
        """
        Ensures a utilisation percentage is between 0 and 1.
        If a percentage is specified like 85.5 (meaning 85.5%), it scales it to 0.855.
        """
        f = DataCleaner.clean_float(val)
        if f > 1.0 and f <= 100.0:
            return f / 100.0
        return f

    @staticmethod
    def clean_flow_type(val: Any) -> str:
        s = DataCleaner.clean_string(val)
        if not s:
            return "Forward"
        s = s.capitalize()  # Forward or Reverse
        if s in ["Forward", "Reverse"]:
            return s
        return "Forward"

    @staticmethod
    def clean_tamper_flag(val: Any) -> str:
        s = DataCleaner.clean_string(val)
        if not s:
            return "CLEAR"
        s = s.upper()
        if s in ["CLEAR", "TAMPER_ALERT", "RECHECK"]:
            return s
        return "CLEAR"

data_cleaner = DataCleaner()
