"""Data loader for CSV and caching"""
import csv
import json
from pathlib import Path
from typing import Dict, List, Set, Optional
from tc_mcp.config import CSV_PATH, CACHE_DIR
from tc_mcp.models import TestCase


class DataLoader:
    """Loads and caches test case data from CSV"""

    def __init__(self):
        self.test_cases: List[TestCase] = []
        self.indices: Dict[str, Dict] = {
            "by_component": {},
            "by_priority": {},
            "by_test_type": {},
            "by_browser": {},
            "by_device": {},
            "by_status": {}
        }
        self.components: Set[str] = set()
        self.priorities: Set[str] = set()
        self.test_types: Set[str] = set()
        self.browsers: Set[str] = set()
        self.devices: Set[str] = set()
        self.statuses: Set[str] = set()

    def load(self) -> bool:
        """Load CSV and build indices"""
        try:
            if not CSV_PATH.exists():
                print(f"CSV file not found at {CSV_PATH}")
                return False

            print(f"Loading CSV from {CSV_PATH}...")
            
            # Read CSV with built-in csv module
            with open(CSV_PATH, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                row_count = 0
                
                for idx, row in enumerate(reader):
                    row_count += 1
                    try:
                        test_case = TestCase(
                            issue_type=row.get("Issue Type", "").strip() or None,
                            issue_key=row.get("Issue Key", "").strip() or "",
                            summary=row.get("Summary", "").strip() or "",
                            description=row.get("Description", "").strip() or None,
                            priority=row.get("Priority", "").strip() or None,
                            component=row.get("Component", "").strip() or "",
                            labels=row.get("Labels", "").strip() or None,
                            test_type=row.get("Test Type", "").strip() or "",
                            preconditions=row.get("Preconditions", "").strip() or None,
                            steps=row.get("Steps", "").strip() or None,
                            expected_result=row.get("Expected Result", "").strip() or None,
                            browser=row.get("Browser", "").strip() or None,
                            device=row.get("Device", "").strip() or None,
                            status=row.get("Status", "").strip() or None
                        )
                        self.test_cases.append(test_case)
                        self._index_test_case(test_case, idx)

                    except Exception as e:
                        print(f"Warning: Failed to load test case at row {idx}: {e}")
                        continue
                
                print(f"Loaded {row_count} test cases")

            print(f"Successfully indexed {len(self.test_cases)} test cases")
            self._print_statistics()
            return True

        except Exception as e:
            print(f"Error loading CSV: {e}")
            import traceback
            traceback.print_exc()
            return False

    def _index_test_case(self, test_case: TestCase, idx: int):
        """Index a single test case for fast lookups"""
        # Index by component
        if test_case.component:
            if test_case.component not in self.indices["by_component"]:
                self.indices["by_component"][test_case.component] = []
            self.indices["by_component"][test_case.component].append(idx)
            self.components.add(test_case.component)

        # Index by priority
        if test_case.priority:
            if test_case.priority not in self.indices["by_priority"]:
                self.indices["by_priority"][test_case.priority] = []
            self.indices["by_priority"][test_case.priority].append(idx)
            self.priorities.add(test_case.priority)

        # Index by test type
        if test_case.test_type:
            if test_case.test_type not in self.indices["by_test_type"]:
                self.indices["by_test_type"][test_case.test_type] = []
            self.indices["by_test_type"][test_case.test_type].append(idx)
            self.test_types.add(test_case.test_type)

        # Index by browser
        if test_case.browser:
            if test_case.browser not in self.indices["by_browser"]:
                self.indices["by_browser"][test_case.browser] = []
            self.indices["by_browser"][test_case.browser].append(idx)
            self.browsers.add(test_case.browser)

        # Index by device
        if test_case.device:
            if test_case.device not in self.indices["by_device"]:
                self.indices["by_device"][test_case.device] = []
            self.indices["by_device"][test_case.device].append(idx)
            self.devices.add(test_case.device)

        # Index by status
        if test_case.status:
            if test_case.status not in self.indices["by_status"]:
                self.indices["by_status"][test_case.status] = []
            self.indices["by_status"][test_case.status].append(idx)
            self.statuses.add(test_case.status)

    def _print_statistics(self):
        """Print data statistics"""
        print("\n=== Data Statistics ===")
        print(f"Total Test Cases: {len(self.test_cases)}")
        print(f"Components: {len(self.components)}")
        print(f"Priorities: {len(self.priorities)}")
        print(f"Test Types: {len(self.test_types)}")
        print(f"Browsers: {len(self.browsers)}")
        print(f"Devices: {len(self.devices)}")
        print(f"Statuses: {len(self.statuses)}")
        print()

    def get_test_cases_by_indices(self, indices: List[int]) -> List[TestCase]:
        """Get test cases by their indices"""
        return [self.test_cases[i] for i in indices if i < len(self.test_cases)]

    def get_all_components(self) -> Set[str]:
        """Get all available components"""
        return self.components

    def get_all_priorities(self) -> Set[str]:
        """Get all available priorities"""
        return self.priorities

    def get_all_test_types(self) -> Set[str]:
        """Get all available test types"""
        return self.test_types

    def get_all_browsers(self) -> Set[str]:
        """Get all available browsers"""
        return self.browsers

    def get_all_devices(self) -> Set[str]:
        """Get all available devices"""
        return self.devices

    def get_all_statuses(self) -> Set[str]:
        """Get all available statuses"""
        return self.statuses


# Global data loader instance
_loader: Optional[DataLoader] = None


def get_data_loader() -> DataLoader:
    """Get or create the global data loader instance"""
    global _loader
    if _loader is None:
        _loader = DataLoader()
        _loader.load()
    return _loader
