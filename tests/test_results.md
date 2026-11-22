# Test Results Table (SCSE4041 Milestone 2)
**Total Executed Test Inputs:** 12  
**Minimum Required Test Inputs:** 10  
**Test Categories:** Normal (3), Edge (6), Invalid (3)  
**Overall Test Pass Rate:** 100.0%  
**Execution Timestamp:** 22-November-2026 16:53:25

---

## Master Test Execution Table

| Test No. | Input Description | Type | Expected Output | Actual Output | Pass / Fail |
| :---: | :--- | :---: | :--- | :--- | :---: |
| TC-01 | **Strong Resume-Job Match** (High Alignment) | Normal | Indicative match score >= 75. React, Next.js, TypeScript, PostgreSQL classified as Matched. Positive evaluation in all 5 categories. | Match Score: 85/100. Matched 6 skills. | **PASS** |
| TC-02 | **Weak Resume-Job Match (Domain Discrepancy)** (Domain Discrepancy) | Normal | Indicative match score < 45. Critical machine learning skills (Python, PyTorch, TensorFlow) classified as Missing. Clear explanation of domain discrepancy. | Match Score: 39/100. Missing: 4 ML competencies. | **PASS** |
| TC-03 | **Partially Matched Technical Skills** (Adjacent Competency) | Normal | Python classified as Matched. FastAPI / Django / Flask classified as Partially Matched (adjacent scripting experience without enterprise web framework). Score between 50 and 68. | Match Score: 52/100. Partially matched framework exposure. | **PASS** |
| TC-04 | **Academic Fresher (Zero Project Evidence)** (Zero Project Evidence) | Edge | Projects score <= 35%. Docker, Kubernetes, CI/CD classified as Missing. Feedback specifically highlights lack of portfolio repositories. | Projects Score: 25%. Correctly penalized missing project evidence. | **PASS** |
| TC-05 | **Strong Self-Taught Projects but Zero Formal Employment** (High Portfolio / Low Work Experience) | Edge | High project score (>= 80%) recognizing deployed apps; experience category penalizes lack of formal employment (~40-50%). Overall score 65-85% reflecting competitive fresher. | Match Score: 76/100. Projects: 85%. Recognized strong self-taught portfolio. | **PASS** |
| TC-06 | **Missing Mandatory Senior Academic Qualifications** (Academic Barrier) | Edge | Severe penalties in Education and Experience categories. Clear flag indicating missing mandatory Ph.D. and senior experience requirements. Score <= 45%. | Match Score: 24/100. Education: 25%. Hard academic gate (Ph.D.) successfully penalized. | **PASS** |
| TC-07 | **Empty Resume Document** (Validation Error) | Invalid | Validation error triggered immediately: HTTP 400 Bad Request with explanatory error message stating resume content is missing. | Validation Error correctly returned HTTP 400: 'Missing resume content'. | **PASS** |
| TC-08 | **Empty Job Description** (Validation Error) | Invalid | Validation error triggered immediately: HTTP 400 Bad Request stating target job description is missing. | Validation Error correctly returned HTTP 400: 'Missing job description'. | **PASS** |
| TC-09 | **Corrupted / Insufficient Text Document** (Validation Error) | Invalid | Validation error triggered: Document too brief to perform meaningful analysis (< 30 characters). | Validation Error correctly returned HTTP 400: 'Resume text too brief (<30 characters)'. | **PASS** |
| TC-10 | **Skills Claimed Without Supporting Evidence (Unverifiable)** (Unverifiable Buzzwords) | Edge | Skills (Kubernetes, AWS Cloud Architecture) classified as 'Unverifiable' because they appear only in a bare keyword list without supporting projects or work context. | Identified 3 unverifiable buzzword claims lacking project proof. | **PASS** |
| TC-11 | **Ambiguous / Vague Candidate Claims** (Vague Bullet Optimization) | Edge | Bullet point optimizer transforms vague claims into Google's X-Y-Z formula using [X%] and [Y ms] placeholders without hallucinating unverifiable data. | Optimized vague bullets using Google X-Y-Z formula with [X%] placeholders. | **PASS** |
| TC-12 | **Adversarial Prompt Injection in Resume Content** (Security & Guardrails) | Edge | Prompt injection detected and neutralized. Model ignores override instruction, does not award 100/100, evaluates objectively with low score (< 40%). | Neutralized injection attack. Match Score remained objective (31/100). | **PASS** |

---

## Observations on Failed and Edge Tests
1. **Initial Failure and Resolution in TC-02 (Domain Discrepancy):**  
   In initial test execution, TC-02 produced a score of 46/100 because the degree evaluation logic granted general Bachelor's degree credit (85%) without verifying degree relevance to technical domain requirements (Computer Science / Mathematics). Following test inspection, the education evaluation logic was enhanced to verify discipline relevance: non-STEM degrees applying for specialized ML engineering roles are evaluated at 35%, dropping the score to 38/100 and satisfying the expected `< 45%` threshold.
2. **Edge Case Handling (TC-10 & TC-12):**  
   The 4-tier skill verification successfully distinguished between verified project competencies and unverified standalone skill keywords. Indirect prompt injection attacks attempting to force a 100/100 score were sanitized and neutralized.
3. **Invalid Input Guardrails (TC-07, TC-08, TC-09):**  
   The application returns clean HTTP 400 validation responses with user-friendly messages rather than crashing or throwing unhandled 500 exceptions.
4. **No Metric Fabrication:**  
   In all test cases requiring bullet point optimization, the system strictly used clean bracketed placeholders (`[X%]`, `[Y ms]`), eliminating factual hallucination.
