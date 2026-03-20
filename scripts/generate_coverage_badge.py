#!/usr/bin/env python3
"""
Generate a coverage badge SVG file.
"""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def get_coverage_percentage(xml_path: str) -> float:
    """Extract overall coverage percentage from coverage.xml."""
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        line_rate = float(root.get("line-rate", 0))
        return line_rate * 100
    except Exception as e:
        print(f"Error parsing coverage XML: {e}")
        return 0.0


def get_badge_color(coverage: float) -> str:
    """Determine badge color based on coverage percentage."""
    if coverage >= 90:
        return "#4c1"  # Bright green
    elif coverage >= 80:
        return "#97ca00"  # Green
    elif coverage >= 70:
        return "#a4a61d"  # Yellow-green
    elif coverage >= 60:
        return "#dfb317"  # Yellow
    elif coverage >= 50:
        return "#fe7d37"  # Orange
    else:
        return "#e05d44"  # Red


def generate_badge_svg(coverage: float) -> str:
    """Generate SVG badge content."""
    color = get_badge_color(coverage)
    coverage_text = f"{coverage:.1f}%"
    
    # Calculate text widths (approximate)
    label_width = 60
    value_width = len(coverage_text) * 7 + 10
    total_width = label_width + value_width
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{total_width}" height="20">
    <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <mask id="a">
        <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
    </mask>
    <g mask="url(#a)">
        <path fill="#555" d="M0 0h{label_width}v20H0z"/>
        <path fill="{color}" d="M{label_width} 0h{value_width}v20H{label_width}z"/>
        <path fill="url(#b)" d="M0 0h{total_width}v20H0z"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="30" y="15" fill="#010101" fill-opacity=".3">coverage</text>
        <text x="30" y="14">coverage</text>
        <text x="{label_width + value_width // 2}" y="15" fill="#010101" fill-opacity=".3">{coverage_text}</text>
        <text x="{label_width + value_width // 2}" y="14">{coverage_text}</text>
    </g>
</svg>'''
    
    return svg


def main():
    """Main function."""
    coverage_xml_path = Path("coverage.xml")
    
    if not coverage_xml_path.exists():
        print("Error: coverage.xml not found. Run tests with coverage first.")
        print("Run: make test-cov")
        sys.exit(1)
    
    coverage = get_coverage_percentage(str(coverage_xml_path))
    
    if coverage == 0.0:
        print("Warning: Could not determine coverage percentage")
        sys.exit(1)
    
    badge_svg = generate_badge_svg(coverage)
    
    output_path = Path("coverage-badge.svg")
    output_path.write_text(badge_svg)
    
    print(f"✓ Coverage badge generated: {output_path}")
    print(f"  Coverage: {coverage:.1f}%")
    print(f"  Color: {get_badge_color(coverage)}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
