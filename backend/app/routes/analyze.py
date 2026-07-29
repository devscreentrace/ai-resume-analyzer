"""Resume analysis endpoints."""

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.models.schemas import AnalysisResult
from app.services.parser import extract_text, parse_sections
from app.services.analyzer import analyze_resume
from app.services.scorer import compute_ats_score

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResult)
async def analyze(
    file: UploadFile = File(...),
    job_description: str = Form(""),
    job_title: str = Form(""),
):
    """Upload a PDF resume and receive AI-powered analysis."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 10 MB.")

    if not contents.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="File content is not a valid PDF.",
        )

    # 1. Extract raw text
    raw_text = extract_text(contents)
    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF. The file may be scanned/image-based.")

    # 2. Parse sections
    parsed = parse_sections(raw_text)

    # 3. AI analysis (skills matching, suggestions, strengths)
    analysis = await analyze_resume(parsed, job_description=job_description, job_title=job_title)

    # 4. ATS scoring
    ats_score = compute_ats_score(parsed, raw_text)

    return AnalysisResult(
        parsed=parsed,
        ats_score=ats_score,
        skill_matches=analysis.get("skill_matches", []),
        suggestions=analysis.get("suggestions", []),
        strengths=analysis.get("strengths", []),
        job_match_score=analysis.get("job_match_score"),
        job_title_match=analysis.get("job_title_match", ""),
    )
