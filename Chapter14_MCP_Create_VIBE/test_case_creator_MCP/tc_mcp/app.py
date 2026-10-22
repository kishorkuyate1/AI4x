"""TestCreator MCP - FastMCP Server Implementation"""
import json
from typing import Optional, List
from fastmcp import FastMCP
from pydantic import BaseModel, Field

from tc_mcp.config import HOST, PORT
from tc_mcp.data_loader import get_data_loader
from tc_mcp.ranking import RankingEngine
from tc_mcp.models import TestCase, FilterCriteria, TestCaseResponse, RankedTestCaseResponse


# Create FastMCP server
server = FastMCP("TestCreator MCP")


@server.tool()
def get_test_cases_by_component(
    component: str = Field(..., description="Component/Module name"),
    limit: int = Field(20, description="Maximum results (1-1000)", ge=1, le=1000)
) -> dict:
    """
    Get all test cases for a specific component/module.
    
    Args:
        component: The component name (e.g., 'SmartCode', 'Funnels', 'Reports')
        limit: Maximum number of results to return
        
    Returns:
        JSON with test cases matching the component
    """
    loader = get_data_loader()
    
    if component not in loader.indices["by_component"]:
        return {
            "status": "success",
            "total_count": 0,
            "returned_count": 0,
            "test_cases": [],
            "message": f"No test cases found for component '{component}'"
        }
    
    indices = loader.indices["by_component"][component][:limit]
    test_cases = loader.get_test_cases_by_indices(indices)
    
    return {
        "status": "success",
        "total_count": len(indices),
        "returned_count": len(test_cases),
        "component": component,
        "test_cases": [tc.dict() for tc in test_cases]
    }


@server.tool()
def filter_by_priority(
    priority: str = Field(..., description="Priority level: Highest, High, Medium, Low"),
    component: Optional[str] = Field(None, description="Optional: filter by component"),
    test_type: Optional[str] = Field(None, description="Optional: filter by test type"),
    limit: int = Field(20, description="Maximum results (1-1000)", ge=1, le=1000)
) -> dict:
    """
    Filter test cases by priority level with optional additional filters.
    
    Args:
        priority: Priority level (Highest, High, Medium, Low)
        component: Optional component filter
        test_type: Optional test type filter
        limit: Maximum number of results
        
    Returns:
        JSON with filtered test cases
    """
    loader = get_data_loader()
    
    if priority not in loader.indices["by_priority"]:
        return {
            "status": "success",
            "total_count": 0,
            "returned_count": 0,
            "test_cases": [],
            "message": f"No test cases found with priority '{priority}'"
        }
    
    # Get indices by priority
    indices = set(loader.indices["by_priority"][priority])
    
    # Apply component filter if specified
    if component and component in loader.indices["by_component"]:
        indices = indices.intersection(set(loader.indices["by_component"][component]))
    
    # Apply test type filter if specified
    if test_type and test_type in loader.indices["by_test_type"]:
        indices = indices.intersection(set(loader.indices["by_test_type"][test_type]))
    
    # Convert to list and limit
    indices = sorted(list(indices))[:limit]
    test_cases = loader.get_test_cases_by_indices(indices)
    
    return {
        "status": "success",
        "total_count": len(indices),
        "returned_count": len(test_cases),
        "filters": {
            "priority": priority,
            "component": component,
            "test_type": test_type
        },
        "test_cases": [tc.dict() for tc in test_cases]
    }


@server.tool()
def filter_by_test_type(
    test_type: str = Field(..., description="Test type: Functional, API, UI/UX, Security, Accessibility, Boundary, Negative, Performance, Regression"),
    component: Optional[str] = Field(None, description="Optional: filter by component"),
    priority: Optional[str] = Field(None, description="Optional: filter by priority"),
    limit: int = Field(20, description="Maximum results (1-1000)", ge=1, le=1000)
) -> dict:
    """
    Filter test cases by test type with optional additional filters.
    
    Args:
        test_type: Test type category
        component: Optional component filter
        priority: Optional priority filter
        limit: Maximum number of results
        
    Returns:
        JSON with filtered test cases
    """
    loader = get_data_loader()
    
    if test_type not in loader.indices["by_test_type"]:
        return {
            "status": "success",
            "total_count": 0,
            "returned_count": 0,
            "test_cases": [],
            "message": f"No test cases found with test type '{test_type}'"
        }
    
    # Get indices by test type
    indices = set(loader.indices["by_test_type"][test_type])
    
    # Apply component filter if specified
    if component and component in loader.indices["by_component"]:
        indices = indices.intersection(set(loader.indices["by_component"][component]))
    
    # Apply priority filter if specified
    if priority and priority in loader.indices["by_priority"]:
        indices = indices.intersection(set(loader.indices["by_priority"][priority]))
    
    # Convert to list and limit
    indices = sorted(list(indices))[:limit]
    test_cases = loader.get_test_cases_by_indices(indices)
    
    return {
        "status": "success",
        "total_count": len(indices),
        "returned_count": len(test_cases),
        "filters": {
            "test_type": test_type,
            "component": component,
            "priority": priority
        },
        "test_cases": [tc.dict() for tc in test_cases]
    }


@server.tool()
def get_test_cases_by_device_browser(
    device: str = Field(..., description="Device type: desktop, tablet, mobile"),
    browser: str = Field(..., description="Browser: Chrome, Firefox, Safari, Edge"),
    os: Optional[str] = Field(None, description="Optional: OS (iOS, Android)"),
    limit: int = Field(20, description="Maximum results (1-1000)", ge=1, le=1000)
) -> dict:
    """
    Get test cases for a specific device/browser combination.
    
    Args:
        device: Device type (desktop, tablet, mobile)
        browser: Browser name
        os: Optional operating system
        limit: Maximum number of results
        
    Returns:
        JSON with matching test cases
    """
    loader = get_data_loader()
    
    # Get device indices
    device_indices = set()
    for key, indices in loader.indices["by_device"].items():
        if device.lower() in key.lower():
            device_indices.update(indices)
    
    if not device_indices:
        return {
            "status": "success",
            "total_count": 0,
            "returned_count": 0,
            "test_cases": [],
            "message": f"No test cases found for device '{device}'"
        }
    
    # Get browser indices
    browser_indices = set()
    for key, indices in loader.indices["by_browser"].items():
        if browser.lower() in key.lower():
            browser_indices.update(indices)
    
    # Intersect device and browser
    indices = device_indices.intersection(browser_indices) if browser_indices else device_indices
    
    # Convert to list and limit
    indices = sorted(list(indices))[:limit]
    test_cases = loader.get_test_cases_by_indices(indices)
    
    return {
        "status": "success",
        "total_count": len(indices),
        "returned_count": len(test_cases),
        "filters": {
            "device": device,
            "browser": browser,
            "os": os
        },
        "test_cases": [tc.dict() for tc in test_cases]
    }


@server.tool()
def search_test_cases(
    keyword: str = Field(..., description="Keyword to search for"),
    search_fields: str = Field("all", description="Fields to search: summary, description, steps, all"),
    limit: int = Field(20, description="Maximum results (1-1000)", ge=1, le=1000)
) -> dict:
    """
    Search test cases by keyword in specified fields.
    
    Args:
        keyword: Search keyword
        search_fields: Fields to search in (summary, description, steps, all)
        limit: Maximum number of results
        
    Returns:
        JSON with matching test cases and relevance scores
    """
    loader = get_data_loader()
    keyword_lower = keyword.lower()
    
    results = []
    for idx, test_case in enumerate(loader.test_cases):
        relevance = 0.0
        
        # Search in summary (highest weight)
        if search_fields in ["all", "summary"] and test_case.summary:
            if keyword_lower in test_case.summary.lower():
                relevance += 3.0
        
        # Search in description (medium weight)
        if search_fields in ["all", "description"] and test_case.description:
            if keyword_lower in test_case.description.lower():
                relevance += 2.0
        
        # Search in steps (medium weight)
        if search_fields in ["all", "steps"] and test_case.steps:
            if keyword_lower in test_case.steps.lower():
                relevance += 2.0
        
        if relevance > 0:
            results.append((idx, relevance, test_case))
    
    # Sort by relevance descending
    results.sort(key=lambda x: x[1], reverse=True)
    
    # Limit results
    limited_results = results[:limit]
    test_cases = [tc for _, rel, tc in limited_results]
    
    return {
        "status": "success",
        "total_count": len(results),
        "returned_count": len(test_cases),
        "keyword": keyword,
        "search_fields": search_fields,
        "test_cases": [
            {**tc.dict(), "relevance_score": rel}
            for _, rel, tc in limited_results
        ]
    }


@server.tool()
def get_top_test_cases_for_module(
    component: str = Field(..., description="Component/Module name"),
    top_n: int = Field(10, description="Number of top results", ge=1, le=100),
    risk_factor: str = Field("medium", description="Risk level: high, medium, low")
) -> dict:
    """
    Get top-ranked test cases for a module using smart ranking algorithm.
    
    Ranking formula: Score = (Priority × 0.4) + (TestType × 0.3) + (Status × 0.2) + (Risk × 0.1)
    
    Args:
        component: Component name
        top_n: Number of top results to return
        risk_factor: Risk level for weighting
        
    Returns:
        JSON with ranked test cases
    """
    loader = get_data_loader()
    
    if component not in loader.indices["by_component"]:
        return {
            "status": "success",
            "total_count": 0,
            "returned_count": 0,
            "test_cases": [],
            "message": f"No test cases found for component '{component}'"
        }
    
    indices = loader.indices["by_component"][component]
    test_cases = loader.get_test_cases_by_indices(indices)
    
    # Rank test cases
    ranked = RankingEngine.rank_test_cases(test_cases, top_n=top_n, risk_factor=risk_factor)
    
    return {
        "status": "success",
        "total_count": len(test_cases),
        "returned_count": len(ranked),
        "component": component,
        "top_n": top_n,
        "risk_factor": risk_factor,
        "scoring_info": RankingEngine.get_scoring_explanation(),
        "test_cases": [tc.dict() for tc in ranked]
    }


@server.tool()
def list_available_components() -> dict:
    """Get list of all available components."""
    loader = get_data_loader()
    components = sorted(list(loader.get_all_components()))
    
    return {
        "status": "success",
        "total_count": len(components),
        "components": components
    }


@server.tool()
def list_available_values(category: str) -> dict:
    """
    Get list of all available values for a category.
    
    Args:
        category: Category name: priorities, test_types, browsers, devices, statuses
        
    Returns:
        JSON with available values for the category
    """
    loader = get_data_loader()
    
    category_map = {
        "priorities": loader.get_all_priorities(),
        "test_types": loader.get_all_test_types(),
        "browsers": loader.get_all_browsers(),
        "devices": loader.get_all_devices(),
        "statuses": loader.get_all_statuses()
    }
    
    if category not in category_map:
        return {
            "status": "error",
            "message": f"Unknown category '{category}'. Available: {list(category_map.keys())}"
        }
    
    values = sorted(list(category_map[category]))
    
    return {
        "status": "success",
        "category": category,
        "total_count": len(values),
        "values": values
    }


async def main():
    """Main entry point for the MCP server"""
    print(f"Starting TestCreator MCP Server...")
    print(f"Listening on {HOST}:{PORT}")
    print(f"\nAvailable tools:")
    print("  - get_test_cases_by_component")
    print("  - filter_by_priority")
    print("  - filter_by_test_type")
    print("  - get_test_cases_by_device_browser")
    print("  - search_test_cases")
    print("  - get_top_test_cases_for_module")
    print("  - list_available_components")
    print("  - list_available_values")
    print("\nConnect via MCP Inspector or any MCP client")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
