# Prompteck | AI-Powered Resume Feedback and Job Match Analyzer
**SCSE4041 – Prompt Engineering (Milestone 2)**  
**Team ID:** PE-B13-45  
**Problem Pool:** C9  
**Team Members:**  
- Ashirwad Sahu   
- Atul Chauhan   
- Shah Yashvi Giriraj   
- Vaishnavi Mishra   

---

## 1. Project Overview
College students and entry-level freshers frequently struggle to tailor their resumes for specific job descriptions, often receiving generic rejection notices without actionable feedback. 

**Prompteck** is an AI-powered resume feedback and job match analyzer built to provide transparent, evidence-based candidate evaluations. Unlike generic chatbots or simple keyword counters, our application implements a **6-stage modular prompt engineering pipeline** and a **strictly enforced weighted scoring rubric (35/25/15/15/10)** to generate:
1. **Indicative Match Score out of 100** based on verified criteria.
2. **4-Tier Skill Classification:**
   - 🟢 **Matched Skills:** Verified with exact textual project evidence.
   - 🟡 **Partially Matched Skills:** Identifies adjacent exposure with missing criteria.
   - 🔴 **Missing Skills:** Critical job requirements absent from candidate text.
   - 🟣 **Unverifiable Skills:** Flags bare keyword claims lacking project/employment proof.
3. **Google X-Y-Z Bullet Point Optimization:** Replaces weak bullets using *Accomplished [X] as measured by [Y], by doing [Z]* with honest bracketed placeholders (`[improved latency by X%]`) to prevent metric fabrication.
4. **Personalized Skill-Gap Learning Roadmap:** Phased milestones (Weeks 1–2, 3–4, Ongoing).
5. **Downloadable Analysis Report:** Clean, academic-formatted PDF report.

---

## 2. Repository Structure
```
Prompteck/
├── ai-resume-system/              # Next.js 16 full-stack web application
│   ├── src/
│   │   ├── app/                   # App Router pages & API routes
│   │   │   ├── api/analyze/       # Backend analysis route handler
│   │   │   ├── globals.css        # Tailwind styling & print stylesheet
│   │   │   └── page.tsx           # Landing page & workspace view
│   │   ├── components/            # UI components (Uploader, Dashboard)
│   │   └── lib/                   # Prompt registry, types, & transformer engine
│   └── package.json
│
├── prompts/                       # Prompt Engineering artifacts
│   ├── baseline_prompt.md         # Version 1 (Baseline zero-shot prompt)
│   ├── version_2.md               # Version 2 (Structured prompt)
│   ├── final_prompts.md           # Version 3 (P1–P6 final production prompt sheets)
│   └── iteration_log.md           # Master 3-version prompt iteration log
│
├── tests/                         # Evaluation & Verification suite
│   ├── run_tests.py               # Automated test execution harness
│   ├── test_cases.md              # Detailed specifications for 12 test inputs
│   ├── test_results.md            # Execution results table (100% pass rate)
│   └── test_evidence/             # Raw JSON test run outputs
│
├── docs/                          # Official documentation & PDFs
│   ├── architecture.md            # System architecture & prompt decomposition
│   ├── milestone2_checklist.md    # Microsoft Form Q1–Q24 answer guide
│   ├── milestone2_main.pdf        # Official 7-Section Milestone 2 PDF
│   └── technical_report.pdf       # Standalone Technical Report PDF
│
├── demo/                          # Demonstration reel materials
│   └── reel_script.md             # Exactly 120-second storyboard & voiceover script
│
├── README.md                      # Comprehensive project documentation
└── .env.example                   # Environment variable template
```

---

## 3. Technology Stack
- **Frontend:** Next.js 16.1.6 (Turbopack), React 19.2.3, Tailwind CSS v4, Lucide React
- **Document Ingestion:** `pdf2json` text parser + raw text paste decoder
- **AI Core:** Google Gemini 2.5 Flash via `@google/generative-ai`
- **Fallback Engine:** Deterministic TypeScript semantic evaluation engine
- **Document Generation:** ReportLab 5.1.0 (Academic PDF compiler)

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Python 3.10+ (for running the test harness or ReportLab PDF generation)

### Installation
1. Clone or extract the project repository:
   ```bash
   cd "ai-resume-system"
   npm install
   ```

2. Configure environment variables (Optional):
   ```bash
   cp ../.env.example .env.local
   ```
   Add your Google Gemini API key if live LLM generation is desired:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: The system includes a built-in deterministic semantic reference engine, so all 12 test cases and the full dashboard function completely even without an API key!)*

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 5. Running the Test Suite
To execute the automated 12-case test suite and regenerate the test logs:
```bash
python tests/run_tests.py
```
Outputs are automatically written to `tests/test_results.md` and `tests/test_evidence/test_execution_log.json`.

---

## 6. Official Milestone 2 Numerical Summary
- **Number of Prompts in Final Solution:** `6` (P1 through P6)
- **Number of Saved Prompt Versions:** `3` (v1 Baseline, v2 Structured, v3 Final Multi-Stage Pipeline)
- **Number of Executed Test Inputs:** `12` (3 Normal, 6 Edge, 3 Invalid)
- **Actual Test Pass Rate:** `100.0%`
- **Prototype Working Status:** `All modules working`
- **Demonstration Reel Duration:** `120 seconds` (within 90–150s range)

---

## 7. Known Limitations & Next Steps
1. **Scanned PDF Optical Character Recognition (OCR):** The current system uses `pdf2json` which extracts selectable text from native PDFs. Image-only or scanned PDFs are flagged with a user-friendly error requesting raw text paste. Future iterations will integrate Tesseract OCR.
2. **Multi-Column PDF Layout Linearization:** Heavily stylized 2-column or 3-column resume layouts occasionally interleave adjacent columns. Future updates will introduce layout-aware bounding box linearizers.
3. **Dynamic User Rubric Customization:** While weights are presently configured in code at 35/25/15/15/10, an upcoming release will provide recruiter sliders to adjust category weights interactively.
