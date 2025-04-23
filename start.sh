#!/bin/bash
# FoodShare Startup Script

# Function to display colored output
print_message() {
  local color=$1
  local message=$2
  
  case $color in
    "green") echo -e "\e[32m$message\e[0m" ;;
    "blue") echo -e "\e[34m$message\e[0m" ;;
    "red") echo -e "\e[31m$message\e[0m" ;;
    "yellow") echo -e "\e[33m$message\e[0m" ;;
    *) echo "$message" ;;
  esac
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
  print_message "red" "Python 3 is not installed. Please install Python 3 to continue."
  exit 1
fi

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
  print_message "blue" "Creating virtual environment..."
  python3 -m venv venv
  if [ $? -ne 0 ]; then
    print_message "red" "Failed to create virtual environment. Please check your Python installation."
    exit 1
  fi
fi

# Activate virtual environment
print_message "blue" "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  source venv/Scripts/activate
else
  source venv/bin/activate
fi

# Check if requirements.txt exists
if [ -f "requirements.txt" ]; then
  print_message "blue" "Installing dependencies..."
  pip install -r requirements.txt
  if [ $? -ne 0 ]; then
    print_message "red" "Failed to install dependencies. Please check requirements.txt."
    exit 1
  fi
else
  print_message "yellow" "requirements.txt not found. Skipping dependency installation."
fi

# Check if .env file exists in backend folder, create sample if it doesn't
if [ ! -f "backend/.env" ]; then
  print_message "yellow" ".env file not found in backend folder. Creating sample .env file..."
  mkdir -p backend
  cat > backend/.env << EOF
# Development environment variables
SECRET_KEY=dev-secret-key-replace-in-production
DATABASE_URI=sqlite:///resource_sharing.db
JWT_SECRET_KEY=jwt-secret-key-replace-in-production

# Email configuration
MAIL_USERNAME=noreply@example.com
MAIL_PASSWORD=password

# CORS settings
CORS_ALLOWED_ORIGINS=http://localhost:3000
EOF
  print_message "yellow" "Sample .env file created in backend folder. Please edit it with your actual configuration."
fi

# Run database setup script if it exists
if [ -f "setup_db.py" ]; then
  print_message "blue" "Setting up database..."
  python setup_db.py
  if [ $? -ne 0 ]; then
    print_message "red" "Failed to set up database."
    exit 1
  fi
else
  print_message "yellow" "setup_db.py not found. Skipping database setup."
fi

# Start the server
print_message "green" "Starting the server..."
python run.py

# Deactivate virtual environment on exit
deactivate