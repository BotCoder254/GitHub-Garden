# PowerShell script for GitHub Contribution Generator

# Function to write colored output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Function to check if a command exists
function Test-Command($CommandName) {
    return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

# Display banner
$banner = @"
  _______ _____ _______ _    _ _    _ ____     ______          _____  _____  ______ _   _ 
 |__   __|_   _|__   __| |  | | |  | |  _ \   / ___\ \        / /  _ \|  __ \|  ____| \ | |
    | |    | |    | |  | |__| | |  | | |_) | | |  _ \ \  /\  / /| |_) | |  | | |__  |  \| |
    | |    | |    | |  |  __  | |  | |  _ <  | | |_) | \/  \/ / |  _ <| |  | |  __| | . ` |
    | |   _| |_   | |  | |  | | |__| | |_) | | |____/ \  /\  /  | |_) | |__| | |____| |\  |
    |_|  |_____|  |_|  |_|  |_|\____/|____/   \_____ \ \/  \/   |____/|_____/|______|_| \_|
"@

Write-ColorOutput Blue $banner
Write-ColorOutput Green "GitHub Contribution Generator"
Write-ColorOutput Yellow "Created by TELVIN TEUM`n"

# Check for required commands
if (-not (Test-Command "node")) {
    Write-ColorOutput Red "Error: Node.js is required but not installed. Please install it first."
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-ColorOutput Red "Error: npm is required but not installed. Please install it first."
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-ColorOutput Red "Error: .env file not found. Please create it with your GitHub credentials."
    exit 1
}

# Check if node_modules exists, if not install dependencies
if (-not (Test-Path "node_modules")) {
    Write-ColorOutput Blue "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "Error: Failed to install dependencies"
        exit 1
    }
}

# Clean up old contribution folders
Write-ColorOutput Blue "Cleaning up old contribution folders..."
Get-ChildItem -Path "contribution-repo-*" -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Run the contribution generator
Write-ColorOutput Green "Starting contribution generator..."
npm start
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Error: Failed to run the contribution generator"
    exit 1
}
