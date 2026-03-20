#!/usr/bin/env python3
"""
Check for potential secrets and sensitive data in staged files.
"""
import re
import sys
import subprocess
from pathlib import Path
from typing import List, Tuple


SECRET_PATTERNS = [
    (r'(?i)(password|passwd|pwd)\s*[:=]\s*["\']?[^\s"\'\n]{8,}', "Potential password"),
    (r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?[^\s"\'\n]{16,}', "Potential API key"),
    (r'(?i)(secret[_-]?key|secretkey)\s*[:=]\s*["\']?[^\s"\'\n]{16,}', "Potential secret key"),
    (r'(?i)(access[_-]?token|accesstoken)\s*[:=]\s*["\']?[^\s"\'\n]{16,}', "Potential access token"),
    (r'(?i)(private[_-]?key|privatekey)\s*[:=]\s*["\']?[^\s"\'\n]{16,}', "Potential private key"),
    (r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----', "Private key found"),
    (r'(?i)(aws[_-]?access[_-]?key[_-]?id)\s*[:=]\s*["\']?[A-Z0-9]{20}', "AWS Access Key ID"),
    (r'(?i)(aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*["\']?[A-Za-z0-9/+=]{40}', "AWS Secret Access Key"),
    (r'(?i)ghp_[0-9a-zA-Z]{36}', "GitHub Personal Access Token"),
    (r'(?i)glpat-[0-9a-zA-Z_-]{20}', "GitLab Personal Access Token"),
    (r'(?i)postgres://[^:]+:[^@]+@', "PostgreSQL connection string with credentials"),
    (r'(?i)mysql://[^:]+:[^@]+@', "MySQL connection string with credentials"),
]

ALLOWED_PATTERNS = [
    r'\.env\.example',
    r'\.env\.template',
    r'test[_-]?password',
    r'test[_-]?secret',
    r'dummy[_-]?password',
    r'fake[_-]?key',
    r'example[_-]?key',
    r'placeholder',
]


def get_staged_files() -> List[str]:
    """Get list of staged files."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
            capture_output=True,
            text=True,
            check=True,
        )
        return [f for f in result.stdout.strip().split('\n') if f]
    except subprocess.CalledProcessError:
        return []


def is_allowed_pattern(text: str) -> bool:
    """Check if text matches any allowed patterns."""
    text_lower = text.lower()
    return any(re.search(pattern, text_lower) for pattern in ALLOWED_PATTERNS)


def scan_file(file_path: str) -> List[Tuple[int, str, str]]:
    """Scan a file for potential secrets."""
    findings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, start=1):
                if is_allowed_pattern(line):
                    continue
                
                for pattern, description in SECRET_PATTERNS:
                    if re.search(pattern, line):
                        findings.append((line_num, description, line.strip()))
    except Exception as e:
        print(f"Warning: Could not scan {file_path}: {e}")
    
    return findings


def main():
    """Main function."""
    staged_files = get_staged_files()
    
    if not staged_files:
        print("No staged files to check.")
        return 0
    
    python_files = [
        f for f in staged_files 
        if f.endswith(('.py', '.env', '.yaml', '.yml', '.json', '.txt'))
        and Path(f).exists()
    ]
    
    if not python_files:
        print("No relevant files to check for secrets.")
        return 0
    
    has_secrets = False
    
    print("\n" + "=" * 80)
    print("CHECKING FOR SECRETS IN STAGED FILES")
    print("=" * 80 + "\n")
    
    for file_path in python_files:
        findings = scan_file(file_path)
        
        if findings:
            has_secrets = True
            print(f"\n⚠️  {file_path}:")
            for line_num, description, line in findings:
                print(f"  Line {line_num}: {description}")
                print(f"    {line[:100]}...")
    
    print("\n" + "=" * 80)
    
    if has_secrets:
        print("✗ Potential secrets detected!")
        print("Please review the findings above and remove any sensitive data.")
        print("=" * 80 + "\n")
        return 1
    else:
        print("✓ No secrets detected in staged files.")
        print("=" * 80 + "\n")
        return 0


if __name__ == "__main__":
    sys.exit(main())
