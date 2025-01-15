# GitHub Garden PowerShell Installer
$ErrorActionPreference = 'Stop'

# Function to handle errors
function Handle-Error {
    param(
        [string]$ErrorMessage
    )
    Write-Host "`n❌ Error: $ErrorMessage" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit 1
}

# Function to pause execution
function Pause-Script {
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
}

try {
    # ASCII Art
    Write-Host @"
  _______ _____ _______ _    _ _    _ ____     ______          _____  _____  ______ _   _ 
 |__   __|_   _|__   __| |  | | |  | |  _ \   / ___\ \        / /  _ \|  __ \|  ____| \ | |
    | |    | |    | |  | |__| | |  | | |_) | | |  _ \ \  /\  / /| |_) | |  | | |__  |  \| |
    | |    | |    | |  |  __  | |  | |  _ <  | | |_) | \/  \/ / |  _ <| |  | |  __| | . ` |
    | |   _| |_   | |  | |  | | |__| | |_) | | |____/ \  /\  /  | |_) | |__| | |____| |\  |
    |_|  |_____|  |_|  |_|  |_|\____/|____/   \_____ \ \/  \/   |____/|_____/|______|_| \_|
"@ -ForegroundColor Cyan

    Write-Host "`nGitHub Garden Installer`n" -ForegroundColor Green
    Write-Host "Created by TELVIN TEUM`n" -ForegroundColor Yellow

    function Verify-Input {
        param (
            [string]$input,
            [string]$type
        )
        switch ($type) {
            "token" { 
                return $input -match "^gh[ps]_[a-zA-Z0-9]{36}$"
            }
            "username" {
                return $input -match "^[a-zA-Z0-9-]+$"
            }
            "email" {
                return $input -match "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
            }
        }
        return $false
    }

    # Check for required tools
    $requiredTools = @{
        "git" = "Git is required. Download from: https://git-scm.com/download/win"
        "node" = "Node.js is required. Download from: https://nodejs.org/"
        "npm" = "npm is required (comes with Node.js): https://nodejs.org/"
        "gh" = "GitHub CLI is required. Download from: https://cli.github.com/"
    }

    foreach ($tool in $requiredTools.Keys) {
        if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
            Handle-Error "$($requiredTools[$tool])"
        }
    }

    # GitHub Authentication
    Write-Host "`n🔑 Checking GitHub Authentication..." -ForegroundColor Cyan
    try {
        gh auth status
    } catch {
        Write-Host "Please login to GitHub CLI first:" -ForegroundColor Yellow
        gh auth login
        if ($LASTEXITCODE -ne 0) {
            Handle-Error "GitHub authentication failed. Please try again."
        }
    }

    # Fork the repository
    Write-Host "`n🍴 Forking the repository..." -ForegroundColor Cyan
    $repoUrl = "https://github.com/BotCoder254/github-garden"
    try {
        gh repo fork $repoUrl --clone=true
        Set-Location "github-garden"
    } catch {
        Handle-Error "Failed to fork repository: $_"
    }

    # Step-by-step environment setup
    Write-Host "`n📝 Let's set up your environment step by step" -ForegroundColor Cyan
    Write-Host "Follow these instructions carefully:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/settings/tokens/new" -ForegroundColor White
    Write-Host "2. Set token name: 'GitHub Garden'" -ForegroundColor White
    Write-Host "3. Set expiration: Custom > 1 year" -ForegroundColor White
    Write-Host "4. Select scopes:" -ForegroundColor White
    Write-Host "   ☑️ repo (Full control of private repositories)" -ForegroundColor White
    Write-Host "   ☑️ workflow (Update GitHub Action workflows)" -ForegroundColor White
    Write-Host "   ☑️ user (Update all user data)" -ForegroundColor White
    Write-Host "5. Click 'Generate token'" -ForegroundColor White
    Write-Host "6. Copy your token (it starts with 'ghp_' or 'ghs_')" -ForegroundColor White

    # Get and verify GitHub token
    do {
        $token = Read-Host "`nPaste your GitHub token"
        if (-not (Verify-Input -input $token -type "token")) {
            Write-Host "❌ Invalid token format. Token should start with 'ghp_' or 'ghs_' and be 40 characters long." -ForegroundColor Red
            continue
        }
        try {
            $env:GITHUB_TOKEN = $token
            gh auth status
            $tokenValid = $true
        } catch {
            Write-Host "❌ Token verification failed. Please check if the token is valid." -ForegroundColor Red
            $tokenValid = $false
        }
    } while (-not $tokenValid)

    Write-Host "✅ Token verified successfully!" -ForegroundColor Green

    # Get and verify GitHub username
    do {
        $username = Read-Host "`nEnter your GitHub username"
        if (-not (Verify-Input -input $username -type "username")) {
            Write-Host "❌ Invalid username format. Username should only contain letters, numbers, and hyphens." -ForegroundColor Red
            continue
        }
        try {
            $userCheck = gh api user -q .login
            if ($userCheck -eq $username) {
                $usernameValid = $true
            } else {
                Write-Host "❌ Username doesn't match your GitHub account." -ForegroundColor Red
                $usernameValid = $false
            }
        } catch {
            Write-Host "❌ Failed to verify username. Please try again." -ForegroundColor Red
            $usernameValid = $false
        }
    } while (-not $usernameValid)

    Write-Host "✅ Username verified successfully!" -ForegroundColor Green

    # Get and verify GitHub email
    do {
        $email = Read-Host "`nEnter your GitHub email"
        if (-not (Verify-Input -input $email -type "email")) {
            Write-Host "❌ Invalid email format." -ForegroundColor Red
            continue
        }
        try {
            $emailCheck = gh api user/emails -q ".[].email | contains([$email])"
            if ($emailCheck) {
                $emailValid = $true
            } else {
                Write-Host "❌ Email not found in your GitHub account." -ForegroundColor Red
                $emailValid = $false
            }
        } catch {
            Write-Host "❌ Failed to verify email. Please try again." -ForegroundColor Red
            $emailValid = $false
        }
    } while (-not $emailValid)

    Write-Host "✅ Email verified successfully!" -ForegroundColor Green

    # Create .env file
    Write-Host "`n📝 Creating .env file..." -ForegroundColor Cyan
    @"
GITHUB_TOKEN=$token
GITHUB_USERNAME=$username
GITHUB_EMAIL=$email
"@ | Out-File -FilePath ".env" -Encoding UTF8

    # Set environment variables for current session
    $env:GITHUB_TOKEN = $token
    $env:GITHUB_USERNAME = $username
    $env:GITHUB_EMAIL = $email

    # Configure git
    git config --global user.name $username
    git config --global user.email $email

    # Verify all settings
    Write-Host "`n🔍 Verifying all settings..." -ForegroundColor Cyan
    $verified = $true

    # Verify Git config
    $gitName = git config --global user.name
    $gitEmail = git config --global user.email
    if ($gitName -ne $username -or $gitEmail -ne $email) {
        Write-Host "❌ Git configuration verification failed" -ForegroundColor Red
        $verified = $false
    }

    # Verify .env file
    if (-not (Test-Path ".env")) {
        Write-Host "❌ .env file verification failed" -ForegroundColor Red
        $verified = $false
    }

    if (-not $verified) {
        Write-Host "❌ Setup verification failed. Please try again." -ForegroundColor Red
        exit 1
    }

    Write-Host "✅ All settings verified successfully!" -ForegroundColor Green

    # Install dependencies
    Write-Host "`n📦 Installing dependencies..." -ForegroundColor Cyan
    try {
        npm install
        
        Write-Host "`n✅ Installation complete!" -ForegroundColor Green
        Write-Host "🚀 Starting GitHub Garden..." -ForegroundColor Cyan
        
        # Run the contribution generator
        node generate-contributions.js
    } catch {
        Handle-Error "Installation failed: $_"
    }

    Write-Host "`n💡 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Your forked repository is ready at: https://github.com/$username/github-garden" -ForegroundColor White
    Write-Host "2. The script will now start generating contributions" -ForegroundColor White
    Write-Host "3. Check your GitHub profile to see the changes!" -ForegroundColor White

    Pause-Script

} catch {
    Handle-Error $_.Exception.Message
}
