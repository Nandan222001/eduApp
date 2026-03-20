$ErrorActionPreference = 'SilentlyContinue'

$basePath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Remove node_modules
$nodeModulesPath = Join-Path $basePath "node_modules"
if (Test-Path $nodeModulesPath) {
    Write-Host "Removing node_modules..."
    Get-ChildItem -Path $nodeModulesPath -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -Path $nodeModulesPath -Force -Recurse -ErrorAction SilentlyContinue
}

# Remove .expo
$expoPath = Join-Path $basePath ".expo"
if (Test-Path $expoPath) {
    Write-Host "Removing .expo..."
    Get-ChildItem -Path $expoPath -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Remove-Item -Path $expoPath -Force -Recurse -ErrorAction SilentlyContinue
}

# Remove package-lock.json
$lockPath = Join-Path $basePath "package-lock.json"
if (Test-Path $lockPath) {
    Write-Host "Removing package-lock.json..."
    Remove-Item -Path $lockPath -Force
}

Write-Host "Cleanup complete!"
