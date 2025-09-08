#!/bin/sh
# TODO: some of the setup steps require bash, so should we just make the whole setup script require bash?

# Benefit Decision Toolkit - One-Step Developer Setup Script
# This script sets up the complete development environment for the Benefit Decision Toolkit

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  printf "${BLUE}[INFO]${NC} %s\n" "$1"
}

print_success() {
  printf "${GREEN}[SUCCESS]${NC} %s\n" "$1"
}

print_warning() {
  printf "${YELLOW}[WARNING]${NC} %s\n" "$1"
}

print_error() {
  printf "${RED}[ERROR]${NC} %s\n" "$1"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
  lsof -i ":$1" >/dev/null 2>&1
}

print_status "🚀 Starting Benefit Decision Toolkit Developer Setup..."

# Check if we're in the right directory
# TODO: actually check the directory as well as the devbox.json
if [ ! -f "devbox.json" ]; then
  print_error "Please run this script from the root of the benefit-decision-toolkit project"
  exit 1
fi

# Check for required tools
print_status "🔍 Checking system requirements..."

# Check for devbox
if ! command_exists devbox; then
  print_warning "Devbox not found. Installing devbox..."
  if command_exists curl; then
    curl -fsSL https://get.jetify.com/devbox/install.sh | bash
    export PATH="$PATH:$HOME/.devbox/bin"
  else
    print_error "curl not found. Please install devbox manually: https://www.jetify.com/devbox/docs/contributor-quickstart/"
    exit 1
  fi
else
  print_status "devbox already installed."
fi

# Check for direnv
if ! command_exists direnv; then
  print_warning "direnv not found. Installing direnv..."
  if command_exists curl; then
    curl -fsSL https://direnv.net/install.sh | bash
    export PATH="$PATH:$HOME/.local/bin"
  else
    print_error "curl not found. Please install direnv manually: https://direnv.net/docs/installation.html"
    exit 1
  fi
else
  print_status "direnv already installed."
fi

print_success "System requirements check completed"

# Initialize devbox environment
# print_status "📦 Setting up devbox environment..."
# if [ -f "devbox.json" ]; then
#   print_success "Devbox environment initialized"
# else
#   print_error "devbox.json not found"
#   exit 1
# fi

exit 0
# Install Node.js dependencies for frontend apps
print_status "📦 Installing frontend dependencies..."

# Builder Frontend
print_status "Installing builder-frontend dependencies..."
cd builder-frontend
if [ -f "package.json" ]; then
  npm install
  print_success "Builder frontend dependencies installed"
else
  print_error "package.json not found in builder-frontend"
  exit 1
fi
cd ..

# Screener Frontend
print_status "Installing screener-frontend dependencies..."
cd screener-frontend
if [ -f "package.json" ]; then
  npm install
  print_success "Screener frontend dependencies installed"
else
  print_error "package.json not found in screener-frontend"
  exit 1
fi
cd ..

# Create environment variable templates
print_status "🔧 Setting up environment variables..."

# Builder Frontend .env template
if [ ! -f "builder-frontend/.env" ]; then
  cat >builder-frontend/.env <<'ENVEOF'
# Firebase Configuration
VITE_API_KEY=your_api_key_here
VITE_AUTH_DOMAIN=your_auth_domain_here
VITE_PROJECT_ID=your_project_id_here
VITE_STORAGE_BUCKET=your_storage_bucket_here
VITE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_APP_ID=your_app_id_here
VITE_MEASUREMENT_ID=your_measurement_id_here

# API Configuration
VITE_API_URL=http://localhost:8080
VITE_SCREENER_BASE_URL=http://localhost:5174
ENVEOF
  print_success "Created builder-frontend/.env template"
else
  print_warning "builder-frontend/.env already exists"
fi

# Screener Frontend .env template
if [ ! -f "screener-frontend/.env" ]; then
  cat >screener-frontend/.env <<'ENVEOF'
# API Configuration
VITE_API_URL=http://localhost:8080
ENVEOF
  print_success "Created screener-frontend/.env template"
else
  print_warning "screener-frontend/.env already exists"
fi

print_success "🎉 Developer setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Get Firebase configuration from a teammate"
echo "2. Update the .env files in builder-frontend/ and screener-frontend/"
echo "3. Run: ./start-dev.sh"
echo ""
print_status "Happy coding! 🚀"
