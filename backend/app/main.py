"""
TraceDoc – Main FastAPI application entry point.
"""
from __future__ import annotations
import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import create_all, get_db, DB_PATH
from app.routers import cases, documents, claims, findings, dossier, workbench
from app.schemas import HealthOut


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and canonical data directories exist
    await create_all()
    yield
    # Shutdown logic if any


app = FastAPI(
    title="VeriStrata CEIE",
    description="Counterfactual Evidence Investigation Engine API & Forensic Workbench",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_trace_and_timing(request: Request, call_next):
    trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
    request.state.trace_id = trace_id
    start_time = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start_time
    response.headers["X-Trace-ID"] = trace_id
    response.headers["X-Process-Time"] = f"{duration:.4f}s"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "trace_id": trace_id,
        },
    )


# Include Routers
app.include_router(workbench.router)
app.include_router(cases.router)
app.include_router(documents.router)
app.include_router(claims.router)
app.include_router(findings.router)
app.include_router(dossier.router)


@app.get("/health", response_model=HealthOut, tags=["health"])
async def health_check():
    db_status = "ok"
    try:
        import aiosqlite
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute("SELECT 1")
    except Exception:
        db_status = "error"

    ocr_status = "ok"
    try:
        import fitz
    except Exception:
        ocr_status = "unavailable"

    solver_status = "ok"
    try:
        import z3
    except Exception:
        solver_status = "unavailable"

    return HealthOut(
        status="ok" if db_status == "ok" else "degraded",
        db=db_status,
        ocr=ocr_status,
        solver=solver_status,
        version=settings.app_version,
    )
