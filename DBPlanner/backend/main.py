from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analyze, generate, convert

# Init
app = FastAPI()

# CORS (All allowed for Development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Main Endpoints
app.include_router(analyze.router, prefix="/api")
app.include_router(generate.router, prefix="/api")
app.include_router(convert.router, prefix="/api")

# Root endpoint
@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}