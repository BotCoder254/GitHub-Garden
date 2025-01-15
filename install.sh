#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ASCII Art
echo -e "${BLUE}"
cat << "EOF"
  _______ _____ _______ _    _ _    _ ____     ______          _____  _____  ______ _   _ 
 |__   __|_   _|__   __| |  | | |  | |  _ \   / ___\ \        / /  _ \|  __ \|  ____| \ | |
    | |    | |    | |  | |__| | |  | | |_) | | |  _ \ \  /\  / /| |_) | |  | | |__  |  \| |
    | |    | |    | |  |  __  | |  | |  _ <  | | |_) | \/  \/ / |  _ <| |  | |  __| | . ` |
    | |   _| |_   | |  | |  | | |__| | |_) | | |____/ \  /\  /  | |_) | |__| | |____| |\  |
    |_|  |_____|  |_|  |_|  |_|\____/|____/   \_____ \ \/  \/   |____/|_____/|______|_| \_|
EOF
echo -e "${NC}"

echo -e "${GREEN}GitHub Garden Installer${NC}"
echo -e "${YELLOW}Created by TELVIN TEUM${NC}\n"

# Verify input function
verify_input() {
    local input=$1
    local type=$2
    case $type in
        "token")
            [[ $input =~ ^gh[ps]_[a-zA-Z0-9]{36}$ ]] && return 0
            ;;
        "username")
            [[ $input =~ ^[a-zA-Z0-9-]+$ ]] && return 0
            ;;
        "email")
            [[ $input =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]] && return 0
            ;;
    esac
    return 1
}

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is required but not installed.${NC}"
        echo -e "${YELLOW}$2${NC}"
        exit 1
    fi
}

# Check all required tools
check_tool "git" "Install git from: https://git-scm.com/downloads"
check_tool "node" "Install Node.js from: https://nodejs.org/"
check_tool "npm" "npm comes with Node.js: https://nodejs.org/"
check_tool "gh" "Install GitHub CLI from: https://cli.github.com/"

# GitHub Authentication
echo -e "\n${BLUE}🔑 Checking GitHub Authentication...${NC}"
if ! gh auth status 2>/dev/null; then
    echo -e "${YELLOW}Please login to GitHub CLI first:${NC}"
    gh auth login
fi

# Fork the repository
echo -e "\n${BLUE}🍴 Forking the repository...${NC}"
REPO_URL="https://github.com/BotCoder254/github-garden"
if ! gh repo fork "$REPO_URL" --clone=true; then
    echo -e "${RED}❌ Failed to fork repository${NC}"
    exit 1
fi

# Change to repository directory
cd github-garden || exit 1

# Step-by-step environment setup
echo -e "\n${BLUE}📝 Let's set up your environment step by step${NC}"
echo -e "${YELLOW}Follow these instructions carefully:${NC}"
echo -e "1. Go to: https://github.com/settings/tokens/new"
echo -e "2. Set token name: 'GitHub Garden'"
echo -e "3. Set expiration: Custom > 1 year"
echo -e "4. Select scopes:"
echo -e "   ☑️ repo (Full control of private repositories)"
echo -e "   ☑️ workflow (Update GitHub Action workflows)"
echo -e "   ☑️ user (Update all user data)"
echo -e "5. Click 'Generate token'"
echo -e "6. Copy your token (it starts with 'ghp_' or 'ghs_')"

# Get and verify GitHub token
while true; do
    echo -e "\n${BLUE}Enter your GitHub token:${NC}"
    read -r token
    if ! verify_input "$token" "token"; then
        echo -e "${RED}❌ Invalid token format. Token should start with 'ghp_' or 'ghs_' and be 40 characters long.${NC}"
        continue
    fi
    export GITHUB_TOKEN="$token"
    if gh auth status 2>/dev/null; then
        echo -e "${GREEN}✅ Token verified successfully!${NC}"
        break
    else
        echo -e "${RED}❌ Token verification failed. Please check if the token is valid.${NC}"
    fi
done

# Get and verify GitHub username
while true; do
    echo -e "\n${BLUE}Enter your GitHub username:${NC}"
    read -r username
    if ! verify_input "$username" "username"; then
        echo -e "${RED}❌ Invalid username format. Username should only contain letters, numbers, and hyphens.${NC}"
        continue
    fi
    if [[ $(gh api user -q .login) == "$username" ]]; then
        echo -e "${GREEN}✅ Username verified successfully!${NC}"
        break
    else
        echo -e "${RED}❌ Username doesn't match your GitHub account.${NC}"
    fi
done

# Get and verify GitHub email
while true; do
    echo -e "\n${BLUE}Enter your GitHub email:${NC}"
    read -r email
    if ! verify_input "$email" "email"; then
        echo -e "${RED}❌ Invalid email format.${NC}"
        continue
    fi
    if gh api user/emails -q ".[].email | contains([\"$email\"])"; then
        echo -e "${GREEN}✅ Email verified successfully!${NC}"
        break
    else
        echo -e "${RED}❌ Email not found in your GitHub account.${NC}"
    fi
done

# Create .env file
echo -e "\n${BLUE}📝 Creating .env file...${NC}"
cat > .env << EOL
GITHUB_TOKEN=$token
GITHUB_USERNAME=$username
GITHUB_EMAIL=$email
EOL

# Export environment variables
export GITHUB_TOKEN="$token"
export GITHUB_USERNAME="$username"
export GITHUB_EMAIL="$email"

# Configure git
git config --global user.name "$username"
git config --global user.email "$email"

# Verify all settings
echo -e "\n${BLUE}🔍 Verifying all settings...${NC}"
verified=true

# Verify Git config
git_name=$(git config --global user.name)
git_email=$(git config --global user.email)
if [[ "$git_name" != "$username" ]] || [[ "$git_email" != "$email" ]]; then
    echo -e "${RED}❌ Git configuration verification failed${NC}"
    verified=false
fi

# Verify .env file
if [[ ! -f ".env" ]]; then
    echo -e "${RED}❌ .env file verification failed${NC}"
    verified=false
fi

if [[ "$verified" != "true" ]]; then
    echo -e "${RED}❌ Setup verification failed. Please try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All settings verified successfully!${NC}"

# Install dependencies
echo -e "\n${GREEN}📦 Installing dependencies...${NC}"
if npm install; then
    echo -e "\n${GREEN}✅ Installation complete!${NC}"
    echo -e "${BLUE}🚀 Starting GitHub Garden...${NC}"
    
    # Run the contribution generator
    node generate-contributions.js
else
    echo -e "${RED}❌ Installation failed${NC}"
    exit 1
fi

# Show next steps
echo -e "\n${YELLOW}💡 Next steps:${NC}"
echo -e "1. Your forked repository is ready at: https://github.com/$username/github-garden"
echo -e "2. The script will now start generating contributions"
echo -e "3. Check your GitHub profile to see the changes!"

# Add to shell configuration if it exists
if [ -f "$HOME/.bashrc" ]; then
    echo -e "\n${BLUE}📝 Adding environment variables to .bashrc...${NC}"
    echo "export GITHUB_TOKEN=\"$token\"" >> "$HOME/.bashrc"
    echo "export GITHUB_USERNAME=\"$username\"" >> "$HOME/.bashrc"
    echo "export GITHUB_EMAIL=\"$email\"" >> "$HOME/.bashrc"
    echo -e "${GREEN}✅ Added to .bashrc${NC}"
fi

if [ -f "$HOME/.zshrc" ]; then
    echo -e "\n${BLUE}📝 Adding environment variables to .zshrc...${NC}"
    echo "export GITHUB_TOKEN=\"$token\"" >> "$HOME/.zshrc"
    echo "export GITHUB_USERNAME=\"$username\"" >> "$HOME/.zshrc"
    echo "export GITHUB_EMAIL=\"$email\"" >> "$HOME/.zshrc"
    echo -e "${GREEN}✅ Added to .zshrc${NC}"
fi
