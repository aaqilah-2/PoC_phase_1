#!/bin/bash

# UWB Warehouse Digital Twin Dashboard Utility Script
# This script provides various functions to set up, run, and manage the dashboard

# Colors for prettier output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to project directory
cd "$(dirname "$0")"

# Print banner
print_banner() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  UWB Warehouse Digital Twin Dashboard Utility  ${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Check prerequisites
check_prereqs() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed.${NC}"
        echo -e "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    node_version=$(node --version)
    echo -e "${GREEN}✓ Node.js ${node_version} is installed${NC}"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed.${NC}"
        echo -e "Please install npm"
        exit 1
    fi
    
    npm_version=$(npm --version)
    echo -e "${GREEN}✓ npm ${npm_version} is installed${NC}"
    
    echo ""
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        echo "Please check the npm error messages above and fix any issues."
        exit 1
    fi
    echo ""
}

# Start development server
start_dev() {
    echo -e "${BLUE}Starting development server...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server when finished.${NC}"
    echo ""
    npm run dev
}

# Build for production
build_prod() {
    echo -e "${BLUE}Building for production...${NC}"
    npm run build
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Production build completed successfully${NC}"
        echo -e "The build output is in the ${BLUE}dist/${NC} directory."
    else
        echo -e "${RED}❌ Production build failed${NC}"
        echo "Please check the error messages above."
        exit 1
    fi
    echo ""
}

# Preview production build
preview_prod() {
    echo -e "${BLUE}Previewing production build...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the preview when finished.${NC}"
    echo ""
    
    if [ ! -d "./dist" ]; then
        echo -e "${RED}❌ Production build not found${NC}"
        echo "Please run './run.sh build' first."
        exit 1
    fi
    
    npm run preview
}

# Run tests
run_tests() {
    echo -e "${BLUE}Running tests...${NC}"
    npm test
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed${NC}"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        echo "Please check the test output above."
    fi
    echo ""
}

# Show help
show_help() {
    echo "Usage: ./run.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Install dependencies and start development server (default)"
    echo "  install     - Install dependencies only"
    echo "  dev         - Start development server"
    echo "  build       - Build for production"
    echo "  preview     - Preview production build"
    echo "  test        - Run tests"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run.sh            - Same as './run.sh start'"
    echo "  ./run.sh build      - Build for production"
    echo ""
}

# Main script logic
print_banner
check_prereqs

# Process command line arguments
case "$1" in
    install)
        install_deps
        ;;
    dev)
        start_dev
        ;;
    build)
        install_deps
        build_prod
        ;;
    preview)
        preview_prod
        ;;
    test)
        run_tests
        ;;
    help)
        show_help
        ;;
    start|"")
        install_deps
        start_dev
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac

# End of script
