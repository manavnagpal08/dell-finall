from typing import TypedDict, List, Dict, Any, Optional
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """
    The state of the LangGraph executive copilot workflow.
    """
    messages: List[BaseMessage]
    
    # Original user query
    query: str
    
    # Planner decisions
    requires_data: bool
    requires_prediction: bool
    requires_optimization: bool
    
    # Extracted parameters from query
    parameters: Dict[str, Any]
    
    # Agent outputs
    data_context: Optional[Dict[str, Any]]
    prediction_context: Optional[Dict[str, Any]]
    optimization_context: Optional[Dict[str, Any]]
    recommendation_context: Optional[Dict[str, Any]]
    
    # Final generated report
    final_report: Optional[str]
    
    # Next node to execute
    next: str
