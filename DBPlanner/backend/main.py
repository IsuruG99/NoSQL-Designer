from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analyze, generate

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/api")
app.include_router(generate.router, prefix="/api")

@app.get("/")
async def read_root():
    return {"message": "Welcome to the FastAPI application!"}