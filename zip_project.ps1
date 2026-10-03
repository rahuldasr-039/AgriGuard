param(
    [string]$SourceDir = "C:\Users\ASHITH\Documents\SIH\SIH",
    [string]$ZipName = "SIH.zip"
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$destPaths = @(
    "C:\Users\ASHITH\Documents\SIH\SIH\SIH.zip",
    "C:\Users\ASHITH\Documents\SIH\SIH.zip",
    "C:\Users\ASHITH\Documents\SIH.zip",
    "C:\Users\ASHITH\Documents\SIH\SIH\AgriGuard_SIH25007.zip",
    "C:\Users\ASHITH\Documents\SIH\AgriGuard_SIH25007.zip"
)

# Target main zip file
$mainZip = "C:\Users\ASHITH\Documents\SIH\SIH.zip"
if (Test-Path $mainZip) {
    Remove-Item $mainZip -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($mainZip, [System.IO.Compression.ZipArchiveMode]::Create)
$excludeDirs = @("node_modules", ".next", ".git", ".idea", ".vscode", "tmp", ".system_generated")
$excludeFiles = @("*.zip", "*.log", "dev.db-journal")

function Add-DirectoryToArchive([string]$dirPath, [string]$prefix) {
    $items = Get-ChildItem -Path $dirPath -Force
    
    foreach ($item in $items) {
        if ($item.PSIsContainer) {
            if ($excludeDirs -notcontains $item.Name) {
                $newPrefix = if ([string]::IsNullOrEmpty($prefix)) { $item.Name } else { "$prefix/$($item.Name)" }
                Add-DirectoryToArchive $item.FullName $newPrefix
            }
        } else {
            $skip = $false
            foreach ($pat in $excludeFiles) {
                if ($item.Name -like $pat) {
                    $skip = $true
                    break
                }
            }
            if (-not $skip) {
                $entryPath = if ([string]::IsNullOrEmpty($prefix)) { $item.Name } else { "$prefix/$($item.Name)" }
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $item.FullName, $entryPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
            }
        }
    }
}

Write-Host "Zipping entire SIH folder from $SourceDir with root folder 'SIH/'..."
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
# We wrap with "SIH" folder prefix so extracting the archive produces the whole "SIH" folder
Add-DirectoryToArchive $SourceDir "SIH"
$zip.Dispose()
$stopwatch.Stop()

$sizeMb = [Math]::Round(((Get-Item $mainZip).Length / 1MB), 2)
Write-Host "Created primary archive: $mainZip ($sizeMb MB in $($stopwatch.ElapsedMilliseconds) ms)"

# Copy to all standard access locations
Copy-Item $mainZip "C:\Users\ASHITH\Documents\SIH\SIH\SIH.zip" -Force
Copy-Item $mainZip "C:\Users\ASHITH\Documents\SIH.zip" -Force

Write-Host "`nAll SIH zip archives are ready:"
Write-Host "1. Workspace Root:  C:\Users\ASHITH\Documents\SIH\SIH\SIH.zip"
Write-Host "2. Parent Directory: C:\Users\ASHITH\Documents\SIH\SIH.zip"
Write-Host "3. Documents Root:   C:\Users\ASHITH\Documents\SIH.zip"
Write-Host "Size: $sizeMb MB"
