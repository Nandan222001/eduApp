# PowerShell script to check MySQL error logs

Write-Host "Checking MySQL Error Logs" -ForegroundColor Cyan
Write-Host "=" * 60

# Common MySQL error log locations
$logLocations = @(
    # XAMPP
    "C:\xampp\mysql\data\*.err",
    # MySQL Server 5.7
    "C:\ProgramData\MySQL\MySQL Server 5.7\Data\*.err",
    # MySQL Server 8.0
    "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err",
    # Custom installations
    "C:\Program Files\MySQL\MySQL Server *\Data\*.err",
    # Linux/WSL paths (if accessible)
    "/var/log/mysql/error.log",
    "/var/log/mysqld.log"
)

$foundLog = $false

foreach ($location in $logLocations) {
    if (Test-Path $location -ErrorAction SilentlyContinue) {
        Write-Host "`nFound MySQL error log: $location" -ForegroundColor Green
        Write-Host "-" * 60
        
        try {
            # Get the most recent error log file if wildcard
            $logFiles = Get-Item $location -ErrorAction SilentlyContinue
            foreach ($logFile in $logFiles) {
                Write-Host "`nReading: $($logFile.FullName)" -ForegroundColor Yellow
                Write-Host "Last modified: $($logFile.LastWriteTime)" -ForegroundColor Gray
                Write-Host "`nLast 100 lines:" -ForegroundColor White
                Write-Host "-" * 60
                
                # Read last 100 lines
                Get-Content $logFile.FullName -Tail 100 | ForEach-Object {
                    # Highlight ERROR lines in red
                    if ($_ -match "ERROR|Error|error|FOREIGN KEY|Foreign key") {
                        Write-Host $_ -ForegroundColor Red
                    } 
                    # Highlight WARNING lines in yellow
                    elseif ($_ -match "WARNING|Warning|warning") {
                        Write-Host $_ -ForegroundColor Yellow
                    }
                    # Normal lines in white
                    else {
                        Write-Host $_
                    }
                }
                
                $foundLog = $true
            }
        } catch {
            Write-Host "Error reading log file: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

if (-not $foundLog) {
    Write-Host "`n❌ No MySQL error logs found in common locations" -ForegroundColor Red
    Write-Host "`nPlease check your MySQL installation and provide the error log path." -ForegroundColor Yellow
    Write-Host "`nCommon locations checked:" -ForegroundColor White
    foreach ($location in $logLocations) {
        Write-Host "  - $location"
    }
    
    Write-Host "`nTo find your MySQL error log:" -ForegroundColor Cyan
    Write-Host "1. Connect to MySQL and run:" -ForegroundColor White
    Write-Host "   SHOW VARIABLES LIKE 'log_error';" -ForegroundColor Gray
    Write-Host "2. Or check your my.ini or my.cnf file for 'log-error' setting" -ForegroundColor White
}

Write-Host "`n" + "=" * 60
Write-Host "Done" -ForegroundColor Green
