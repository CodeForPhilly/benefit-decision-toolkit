#!/usr/bin/env bash

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Detect the current shell
detect_shell() {
  if [[ -n "${ZSH_VERSION:-}" ]]; then
    echo "zsh"
  elif [[ -n "${BASH_VERSION:-}" ]]; then
    echo "bash"
  elif [[ -n "${FISH_VERSION:-}" ]]; then
    echo "fish"
  else
    # Fallback to checking SHELL environment variable
    case "${SHELL:-}" in
    */zsh) echo "zsh" ;;
    */bash) echo "bash" ;;
    */fish) echo "fish" ;;
    *) echo "unknown" ;;
    esac
  fi
}

# Check if direnv is installed
check_direnv_installed() {
  if ! command -v direnv >/dev/null 2>&1; then
    print_error "direnv is not installed or not in PATH"
    echo
    echo "Please install direnv first:"
    echo "  macOS: brew install direnv"
    echo "  Ubuntu/Debian: sudo apt install direnv"
    echo "  Arch: sudo pacman -S direnv"
    echo "  Or visit: https://direnv.net/docs/installation.html"
    exit 1
  fi
}

# Check if direnv hook is already configured
check_existing_hook() {
  local shell_name="$1"
  local config_file="$2"

  if [[ -f "$config_file" ]] && grep -q "direnv hook" "$config_file"; then
    # TODO: make this work even if the line is commented out
    return 0 # Hook already exists
  else
    return 1 # Hook doesn't exist
  fi
}

# Get the appropriate config file for the shell
get_config_file() {
  local shell_name="$1"
  local config_file=""

  case "$shell_name" in
  zsh)
    # Check for .zshrc in order of preference
    if [[ -f "$HOME/.zshrc" ]]; then
      config_file="$HOME/.zshrc"
    else
      config_file="$HOME/.zshrc" # Will be created
    fi
    ;;
  bash)
    # Check for bash config files in order of preference
    if [[ -f "$HOME/.bashrc" ]]; then
      config_file="$HOME/.bashrc"
    elif [[ -f "$HOME/.bash_profile" ]]; then
      config_file="$HOME/.bash_profile"
    else
      config_file="$HOME/.bashrc" # Will be created
    fi
    ;;
  fish)
    # Fish config
    config_file="$HOME/.config/fish/config.fish"
    # Ensure the directory exists
    mkdir -p "$(dirname "$config_file")"
    ;;
  *)
    return 1
    ;;
  esac

  echo "$config_file"
}

# Add direnv hook to shell config
add_direnv_hook() {
  local shell_name="$1"
  local config_file="$2"

  print_status "Adding direnv hook to $config_file"

  # Create a backup if file exists
  if [[ -f "$config_file" ]]; then
    cp "$config_file" "${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
    print_status "Created backup: ${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
  fi

  # Add the hook with some nice formatting
  cat >>"$config_file" <<EOF

# direnv hook (added by setup script)
eval "\$(direnv hook $shell_name)"
EOF

  print_success "Added direnv hook to $config_file"
}

# Main setup function
setup_direnv_hook() {
  print_status "Setting up direnv shell hook..."
  echo

  # Check if direnv is installed
  check_direnv_installed

  # Detect shell
  local shell_name
  shell_name=$(detect_shell)

  if [[ "$shell_name" == "unknown" ]]; then
    print_error "Could not detect your shell"
    echo "Supported shells: bash, zsh, fish"
    echo "Please manually add the following to your shell's config file:"
    echo '  eval "$(direnv hook <your-shell>)"'
    exit 1
  fi

  print_status "Detected shell: $shell_name"

  # Get config file
  local config_file
  config_file=$(get_config_file "$shell_name")

  if [[ -z "$config_file" ]]; then
    print_error "Could not determine config file for $shell_name"
    exit 1
  fi

  print_status "Shell config file: $config_file"

  # Check if hook already exists
  if check_existing_hook "$shell_name" "$config_file"; then
    print_success "direnv hook is already configured in $config_file"
    echo
    print_status "You're all set! Make sure to restart your shell or run:"
    echo "  source $config_file"
    return 0
  fi

  # Ask for confirmation
  echo
  print_warning "This will add the direnv hook to your $config_file"
  read -p "Continue? (y/N): " -n 1 -r
  echo

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setup cancelled"
    echo
    print_status "To manually set up direnv, add this line to your $config_file:"
    echo "  eval \"\$(direnv hook $shell_name)\""
    exit 0
  fi

  # Add the hook
  add_direnv_hook "$shell_name" "$config_file"

  echo
  print_success "direnv hook has been added successfully!"
  echo
  print_status "Next steps:"
  echo "  1. Restart your shell or run: source $config_file"
  echo "  2. Navigate to your project directory"
  echo "  3. Run: direnv allow"
  echo
  print_status "For more information, visit: https://direnv.net/docs/hook.html"
}

# Help function
show_help() {
  cat <<EOF
direnv Setup Script

This script automatically configures the direnv shell hook for your current shell.

Usage:
  $0 [options]

Options:
  -h, --help     Show this help message
  -y, --yes      Skip confirmation prompt

Supported shells:
  - bash
  - zsh  
  - fish

The script will:
1. Detect your current shell
2. Find the appropriate config file
3. Add the direnv hook if not already present
4. Create a backup of your config file

EOF
}

# Parse command line arguments
SKIP_CONFIRMATION=false

while [[ $# -gt 0 ]]; do
  case $1 in
  -h | --help)
    show_help
    exit 0
    ;;
  -y | --yes)
    SKIP_CONFIRMATION=true
    shift
    ;;
  *)
    print_error "Unknown option: $1"
    echo "Use -h or --help for usage information"
    exit 1
    ;;
  esac
done

# Override confirmation if --yes was passed
if [[ "$SKIP_CONFIRMATION" == true ]]; then
  # Modify the setup function to skip confirmation
  setup_direnv_hook() {
    print_status "Setting up direnv shell hook (auto-confirm mode)..."
    echo

    check_direnv_installed

    local shell_name
    shell_name=$(detect_shell)

    if [[ "$shell_name" == "unknown" ]]; then
      print_error "Could not detect your shell"
      echo "Supported shells: bash, zsh, fish"
      echo "Please manually add the following to your shell's config file:"
      echo '  eval "$(direnv hook <your-shell>)"'
      exit 1
    fi

    print_status "Detected shell: $shell_name"

    local config_file
    config_file=$(get_config_file "$shell_name")

    if [[ -z "$config_file" ]]; then
      print_error "Could not determine config file for $shell_name"
      exit 1
    fi

    print_status "Shell config file: $config_file"

    if check_existing_hook "$shell_name" "$config_file"; then
      print_success "direnv hook is already configured in $config_file"
      echo
      print_status "You're all set! Make sure to restart your shell or run:"
      echo "  source $config_file"
      echo
      print_status "If you have any trouble, you can setup the hook manually "
      return 0
    fi

    add_direnv_hook "$shell_name" "$config_file"

    echo
    print_success "direnv hook has been added successfully!"
    echo
    print_status "Next steps:"
    echo "  1. Restart your shell or run: source $config_file"
    echo "  2. Navigate to your project directory"
    echo "  3. Run: direnv allow"
    echo
    print_status "For more information, visit: https://direnv.net/docs/hook.html"
  }
fi

# Run the setup
setup_direnv_hook
