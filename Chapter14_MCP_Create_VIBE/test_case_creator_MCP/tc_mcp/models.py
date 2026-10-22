"""Pydantic models for TestCreator MCP"""
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field


class PriorityLevel(str, Enum):
    """Test case priority levels"""
    HIGHEST = "Highest"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class TestType(str, Enum):
    """Test case types"""
    FUNCTIONAL = "Functional"
    UI_UX = "UI/UX"
    API = "API"
    ACCESSIBILITY = "Accessibility"
    SECURITY = "Security"
    BOUNDARY = "Boundary"
    NEGATIVE = "Negative"
    PERFORMANCE = "Performance"
    REGRESSION = "Regression"


class TestStatus(str, Enum):
    """Test case status"""
    READY = "Ready"
    DRAFT = "Draft"
    AUTOMATED = "Automated"
    DEPRECATED = "Deprecated"


class TestCase(BaseModel):
    """Test case model"""
    issue_type: Optional[str] = None
    issue_key: str
    summary: str
    description: Optional[str] = None
    priority: Optional[str] = None
    component: str
    labels: Optional[str] = None
    test_type: str
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    browser: Optional[str] = None
    device: Optional[str] = None
    status: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "issue_key": "VWO-1001",
                "summary": "[SmartCode] Functional: ensure data collection",
                "priority": "Medium",
                "component": "SmartCode",
                "test_type": "Functional",
                "status": "Ready"
            }
        }


class FilterCriteria(BaseModel):
    """Filter criteria for test case queries"""
    component: Optional[str] = None
    priority: Optional[List[PriorityLevel]] = None
    test_type: Optional[List[TestType]] = None
    browser: Optional[str] = None
    device: Optional[str] = None
    status: Optional[List[TestStatus]] = None
    keyword: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=1000)
    offset: int = Field(default=0, ge=0)


class TestCaseResponse(BaseModel):
    """Response model for test case queries"""
    total_count: int
    returned_count: int
    offset: int
    limit: int
    test_cases: List[TestCase]


class RankedTestCase(TestCase):
    """Test case with ranking score"""
    score: float = Field(default=0.0, ge=0.0, le=1.0)
    rank: Optional[int] = None


class RankedTestCaseResponse(BaseModel):
    """Response model for ranked test case queries"""
    total_count: int
    returned_count: int
    test_cases: List[RankedTestCase]


class GeneratedTestCase(BaseModel):
    """Generated test case model"""
    summary: str
    description: Optional[str] = None
    component: str
    test_type: str
    priority: str
    preconditions: Optional[str] = None
    steps: Optional[str] = None
    expected_result: Optional[str] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    reason: Optional[str] = None


class ExportFormat(str, Enum):
    """Export formats for test cases"""
    JSON = "json"
    CSV = "csv"
    JIRA_XML = "jira_xml"


class JiraTicket(BaseModel):
    """JIRA ticket model"""
    project_key: str
    summary: str
    description: Optional[str] = None
    issue_type: str = "Test"
    priority: Optional[str] = None
    assignee: Optional[str] = None
    labels: Optional[List[str]] = None


class CoverageReport(BaseModel):
    """Test coverage report"""
    component: Optional[str] = None
    group_by: str = "test_type"
    total_test_cases: int
    breakdown: dict
    gaps: List[str]
    recommendations: List[str]
