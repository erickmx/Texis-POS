# Ensure PATH has typical macOS paths if we are on macOS
if ($IsMacOS -or $IsLinux) {
    $extraPaths = @("/usr/local/bin", "/opt/homebrew/bin")
    foreach ($path in $extraPaths) {
        if (Test-Path $path) {
            if ($env:PATH -notlike "*$path*") {
                $env:PATH = $path + [IO.Path]::PathSeparator + $env:PATH
            }
        }
    }
    # Check for ~/.cargo/bin
    $homePath = [System.Environment]::GetFolderPath('UserProfile')
    $cargoBin = Join-Path $homePath ".cargo/bin"
    if (Test-Path $cargoBin) {
        if ($env:PATH -notlike "*$cargoBin*") {
            $env:PATH = $cargoBin + [IO.Path]::PathSeparator + $env:PATH
        }
    }
}

Write-Host "Checking prerequisites..."

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH."
    Exit 1
}

# Check Yarn
if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    Write-Error "Yarn is not installed or not in PATH."
    Exit 1
}

# Check Cargo/Rust
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Error "Cargo (Rust) is not installed or not in PATH."
    Exit 1
}

Write-Host "Prerequisites check passed."

# Set environment variables for Tauri build
$env:TAURI_BUILD = "true"
$env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080"

$uiDir = Resolve-Path "$PSScriptRoot/../../ui"
$desktopDir = Resolve-Path "$PSScriptRoot/.."

Write-Host "Building UI static assets in $uiDir..."
Push-Location $uiDir
try {
    Write-Host "Installing UI dependencies..."
    yarn install
    if ($LASTEXITCODE -ne 0) { throw "yarn install in UI failed" }

    Write-Host "Building UI..."
    yarn build
    if ($LASTEXITCODE -ne 0) { throw "yarn build in UI failed" }
}
finally {
    Pop-Location
}

Write-Host "Building Tauri desktop application in $desktopDir..."
Push-Location $desktopDir
try {
    Write-Host "Installing desktop dependencies..."
    yarn install
    if ($LASTEXITCODE -ne 0) { throw "yarn install in desktop failed" }

    Write-Host "Compiling Tauri app..."
    yarn tauri build
    if ($LASTEXITCODE -ne 0) { throw "yarn tauri build failed" }
}
finally {
    Pop-Location
}

Write-Host "Tauri build completed successfully!"
