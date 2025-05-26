@echo off
echo Changing directory to DBPlanner\backend
cd DBPlanner\backend || (echo Failed to change directory & exit /b)
echo Activating virtual environment
call venv\Scripts\activate || (echo Failed to activate virtual environment & exit /b)
echo Starting Uvicorn server
uvicorn main:app --reload || (echo Failed to start Uvicorn server & exit /b)