"""Ranking and scoring logic for test cases"""
from typing import List, Dict
from tc_mcp.models import TestCase, RankedTestCase, PriorityLevel, TestType


class RankingEngine:
    """Engine for ranking test cases based on multiple factors"""

    # Scoring weights
    PRIORITY_WEIGHTS = {
        "Highest": 3.0,
        "High": 2.0,
        "Medium": 1.0,
        "Low": 0.5
    }

    TEST_TYPE_WEIGHTS = {
        "Functional": 1.0,
        "API": 1.2,
        "Security": 1.5,
        "Boundary": 0.8,
        "Negative": 0.8,
        "UI/UX": 0.7,
        "Accessibility": 0.9,
        "Performance": 1.3,
        "Regression": 1.1
    }

    STATUS_WEIGHTS = {
        "Ready": 1.0,
        "Automated": 1.2,
        "Draft": 0.5,
        "Deprecated": 0.0
    }

    RISK_WEIGHTS = {
        "high": 1.5,
        "medium": 1.0,
        "low": 0.5
    }

    @staticmethod
    def calculate_score(
        test_case: TestCase,
        priority_weight: float = 0.4,
        test_type_weight: float = 0.3,
        status_weight: float = 0.2,
        risk_weight: float = 0.1,
        risk_factor: str = "medium"
    ) -> float:
        """
        Calculate a composite ranking score for a test case.
        
        Score = (Priority × 0.4) + (TestType × 0.3) + (Status × 0.2) + (Risk × 0.1)
        Each component is normalized to 0-1 range.
        """
        
        # Priority component (0-3 → normalize to 0-1)
        priority_score = (
            RankingEngine.PRIORITY_WEIGHTS.get(test_case.priority or "Medium", 1.0) / 3.0
        )
        
        # Test type component (0-1.5 → normalize to 0-1)
        test_type_score = (
            RankingEngine.TEST_TYPE_WEIGHTS.get(test_case.test_type or "Functional", 1.0) / 1.5
        )
        
        # Status component (0-1.2 → normalize to 0-1)
        status_score = (
            RankingEngine.STATUS_WEIGHTS.get(test_case.status or "Draft", 0.5) / 1.2
        )
        
        # Risk component (0-1.5 → normalize to 0-1)
        risk_score = (
            RankingEngine.RISK_WEIGHTS.get(risk_factor, 1.0) / 1.5
        )
        
        # Composite score (weighted average)
        composite_score = (
            priority_score * priority_weight +
            test_type_score * test_type_weight +
            status_score * status_weight +
            risk_score * risk_weight
        )
        
        return min(1.0, max(0.0, composite_score))

    @staticmethod
    def rank_test_cases(
        test_cases: List[TestCase],
        top_n: int = 10,
        risk_factor: str = "medium"
    ) -> List[RankedTestCase]:
        """
        Rank test cases and return top N.
        
        Args:
            test_cases: List of test cases to rank
            top_n: Number of top results to return
            risk_factor: Risk level (high, medium, low)
            
        Returns:
            List of RankedTestCase objects sorted by score descending
        """
        
        ranked = []
        for test_case in test_cases:
            score = RankingEngine.calculate_score(test_case, risk_factor=risk_factor)
            ranked_case = RankedTestCase(
                **test_case.dict(),
                score=score
            )
            ranked.append(ranked_case)
        
        # Sort by score descending
        ranked.sort(key=lambda x: x.score, reverse=True)
        
        # Add rank numbers
        for idx, ranked_case in enumerate(ranked[:top_n], 1):
            ranked_case.rank = idx
        
        return ranked[:top_n]

    @staticmethod
    def get_scoring_explanation() -> Dict[str, Dict]:
        """Get explanation of scoring algorithm"""
        return {
            "algorithm": "Weighted composite scoring",
            "components": {
                "priority": {
                    "weight": 0.4,
                    "values": RankingEngine.PRIORITY_WEIGHTS
                },
                "test_type": {
                    "weight": 0.3,
                    "values": RankingEngine.TEST_TYPE_WEIGHTS
                },
                "status": {
                    "weight": 0.2,
                    "values": RankingEngine.STATUS_WEIGHTS
                },
                "risk": {
                    "weight": 0.1,
                    "values": RankingEngine.RISK_WEIGHTS
                }
            },
            "formula": "score = (P × 0.4) + (T × 0.3) + (S × 0.2) + (R × 0.1), normalized to [0, 1]"
        }
