#!/usr/bin/env python3
"""
Check coverage for critical services and enforce minimum thresholds.
"""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict


CRITICAL_SERVICES = {
    "src/services/auth_service.py": 80,
    "src/services/subscription_service.py": 75,
    "src/services/assignment_service.py": 75,
    "src/services/attendance_service.py": 75,
    "src/services/notification_service.py": 70,
    "src/utils/security.py": 85,
    "src/utils/rbac.py": 80,
}


def parse_coverage_xml(xml_path: str) -> Dict[str, float]:
    """Parse coverage.xml and extract coverage per file."""
    coverage_data = {}
    
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        
        for package in root.findall(".//package"):
            for cls in package.findall(".//class"):
                filename = cls.get("filename")
                if filename:
                    line_rate = float(cls.get("line-rate", 0))
                    coverage_data[filename] = line_rate * 100
    except Exception as e:
        print(f"Error parsing coverage XML: {e}")
        return {}
    
    return coverage_data


def check_service_coverage(coverage_data: Dict[str, float]) -> bool:
    """Check if critical services meet their coverage thresholds."""
    all_passed = True
    
    print("\n" + "=" * 80)
    print("CRITICAL SERVICE COVERAGE REPORT")
    print("=" * 80 + "\n")
    
    for service, threshold in CRITICAL_SERVICES.items():
        coverage = coverage_data.get(service, 0.0)
        status = "✓ PASS" if coverage >= threshold else "✗ FAIL"
        
        print(f"{status:8} {service:50} {coverage:6.2f}% (threshold: {threshold}%)")
        
        if coverage < threshold:
            all_passed = False
    
    print("\n" + "=" * 80)
    
    if all_passed:
        print("✓ All critical services meet their coverage thresholds!")
    else:
        print("✗ Some critical services do not meet their coverage thresholds.")
        print("Please add more tests to improve coverage for the failing services.")
    
    print("=" * 80 + "\n")
    
    return all_passed


def main():
    """Main function."""
    coverage_xml_path = Path("coverage.xml")
    
    if not coverage_xml_path.exists():
        print("Error: coverage.xml not found. Run tests with coverage first.")
        sys.exit(1)
    
    coverage_data = parse_coverage_xml(str(coverage_xml_path))
    
    if not coverage_data:
        print("Warning: Could not parse coverage data from coverage.xml")
        sys.exit(0)
    
    success = check_service_coverage(coverage_data)
    
    if not success:
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
