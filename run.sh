#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to display error and exit
error() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 is required but not installed. Please install it first."
    fi
}

# Display banner
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
echo -e "${GREEN}GitHub Contribution Generator${NC}"
echo -e "${YELLOW}Created by TELVIN TEUM${NC}\n"

# Check for required commands
check_command "node"
check_command "npm"

# Check if .env file exists
if [ ! -f ".env" ]; then
    error ".env file not found. Please create it with your GitHub credentials."
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install || error "Failed to install dependencies"
fi

# Run the contribution generator
echo -e "${GREEN}Starting contribution generator...${NC}"
npm start || error "Failed to run the contribution generator"
