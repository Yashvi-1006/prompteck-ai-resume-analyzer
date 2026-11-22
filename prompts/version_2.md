# Version 2 — Structured Prompt (Intermediate Iteration)  
**Tool/Model:** Generative LLM with JSON Mode  
**Prompt ID:** `PROMPT_V2_STRUCTURED`

## System Persona & Prompt Text
```text
You are an expert AI Resume Analyst and Career Coach for top tech companies.
Analyze the following resume against the provided job description.

Job Description:
"""
{jd}
"""

Resume text:
"""
{resumeText}
"""

Return a JSON object precisely matching this structure:
{
  "atsScore": number (0-100),
  "grammarScore": number (0-100),
  "impactScore": number (0-100),
  "benchmarks": {
    "google": boolean (meets Google's strict impact/action formula standards),
    "microsoft": boolean (meets Microsoft's clarity and depth standards),
    "amazon": boolean (shows clear data points and leadership principles)
  },
  "suggestions": [
    {
      "category": string (e.g., "Action Verbs", "Quantification", "Formatting"),
      "description": string (actionable feedback),
      "impact": "High" | "Medium" | "Low"
    }
  ] (Return exactly 3-5 high quality suggestions),
  "tailoredSummary": string (A rewritten, highly impactful 2-3 sentence professional summary tailored to the JD)
}
```

## Changes Introduced Since Version 1
1. **Defined Expert Role:** Established persona as an expert technical resume coach for top tech companies.
2. **Strict JSON Schema:** Enforced structured JSON output with `responseMimeType: "application/json"`.
3. **Multi-Metric Scoring:** Decomposed evaluation into ATS score, Grammar score, and Impact score.
4. **FAANG Benchmarks:** Introduced binary flags evaluating alignment with Google, Microsoft, and Amazon standards.

## Observed Results & Remaining Limitations
- **JSON Reliability:** Output parsing success rate increased to ~96%.
- **Subjective Scoring:** The overall ATS score still varied because individual criteria lacked explicit percentage weights.
- **Persistent Metric Fabrication:** When asked to provide quantification suggestions, the model still frequently recommended inventing specific numbers.
- **Missing Gap Detail:** Did not distinguish between partially matched skills vs missing mandatory qualifications vs unverifiable keyword claims.
- **No Defense Against Prompt Injection:** Instructions embedded in candidate text still occasionally confused the model.
