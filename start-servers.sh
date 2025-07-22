#!/bin/bash

# Start Flask backend in background
echo "Starting Flask backend..."
python app.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Start React frontend
echo "Starting React frontend..."
npm run dev

# Clean up Flask process when script exits
trap "kill $FLASK_PID" EXIT