'use client';

import { useState } from 'react';
import { 
  Loader2, 
  Sparkles, 
  FileCheck, 
  Target, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import ResumeUploader from '@/components/ResumeUploader';
import ResultsDashboard from '@/components/ResultsDashboard';
import { ComprehensiveAnalysisResult } from '@/lib/analysisTypes';

// Pre-configured Job Description Presets for fast, repeatable academic evaluation
const JD_PRESETS = [
  {
    title: "Full-Stack Software Engineer",
    text: `Job Title: Full-Stack Software Engineer (Junior / Entry-Level)
Location: Remote / Hybrid
Role Overview: We are looking for a Software Engineer to join our core product team.
Key Responsibilities:
- Design, build, and maintain full-stack web applications using React, Next.js, and TypeScript.
- Develop secure, scalable RESTful APIs and integrate PostgreSQL databases.
- Write clean, modular, and maintainable code with unit tests (Jest/Pytest).
- Collaborate in an Agile environment with CI/CD deployment pipelines using Docker and GitHub Actions.

Requirements:
- Bachelor's degree in Computer Science, Information Technology, or related engineering discipline.
- Strong proficiency in JavaScript/TypeScript, Python, and modern web frameworks (React, Next.js).
- Hands-on experience with Relational Databases (PostgreSQL/MySQL) and ORMs.
- Practical understanding of containerization (Docker) and version control (Git/GitHub).
- Exposure to cloud deployment (AWS/GCP/Vercel) and microservices architecture is a plus.`
  },
  {
    title: "Data Science & ML Intern",
    text: `Job Title: Machine Learning & Data Science Intern
Department: AI Research & Data Analytics
Role Overview: Seeking an ambitious Data Science intern to assist in building predictive models.
Key Responsibilities:
- Extract, clean, and preprocess large-scale unstructured datasets using Pandas and NumPy.
- Train and evaluate supervised and unsupervised machine learning models (Scikit-Learn, PyTorch).
- Build data visualization dashboards and perform exploratory data analysis (EDA).
- Collaborate with engineering to deploy models via FastAPI microservices.

Requirements:
- Enrolled in or graduated with a degree in Computer Science, Statistics, or Mathematics.
- Proficient in Python, SQL, and data science libraries (Pandas, NumPy, Scikit-Learn).
- Solid theoretical understanding of machine learning algorithms and neural network architectures.
- Experience with Git, Jupyter notebooks, and data storytelling.`
  },
  {
    title: "Frontend React Developer",
    text: `Job Title: Frontend React & Next.js Developer
Role Overview: Build responsive, user-centered web applications with modern design systems.
Key Responsibilities:
- Implement pixel-perfect, accessible UI components in React, Next.js, and Tailwind CSS.
- Optimize frontend performance, SEO, and client-side data fetching with React Query/SWR.
- Integrate RESTful endpoints and handle state management.
Requirements:
- Degree in Computer Science or equivalent practical exposure.
- Expert knowledge of HTML5, CSS3, JavaScript (ES6+), and TypeScript.
- Strong portfolio of deployed responsive web applications.`
  },
  {
    title: "Cloud & DevOps Intern",
    text: `Job Title: Cloud Infrastructure & DevOps Intern
Key Responsibilities:
- Automate build and release pipelines using GitHub Actions and Docker containers.
- Monitor cloud infrastructure and assist in Kubernetes cluster management.
- Script routine maintenance tasks using Python and Bash.
Requirements:
- Understanding of Linux fundamentals, networking (TCP/IP, DNS), and Git.
- Hands-on experience with Docker containerization.
- Familiarity with AWS or GCP services.`
  }
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [pastedResume, setPastedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<ComprehensiveAnalysisResult | null>(null);

  const handleApplyPreset = (text: string) => {
    setJobDescription(text);
  };

  const handleAnalyze = async () => {
    setErrorMessage(null);

    if (mode === 'file' && !file) {
      setErrorMessage('Please upload a resume PDF or switch to "Paste Resume Text".');
      return;
    }
    if (mode === 'text' && !pastedResume.trim()) {
      setErrorMessage('Please paste candidate resume text to analyze.');
      return;
    }
    if (mode === 'text' && pastedResume.trim().length < 30) {
      setErrorMessage(
        'Resume text is too brief (minimum 30 characters). Please include your skills, education, and projects or experience.'
      );
      return;
    }

    const trimmedJd = jobDescription.trim();
    if (!trimmedJd) {
      setErrorMessage(
        'Please provide a target job description (include role title and required skills, or choose an example above).'
      );
      return;
    }
    const jdWords = trimmedJd.split(/\s+/).filter(Boolean);
    if (trimmedJd.length < 10 || (jdWords.length < 2 && trimmedJd.length < 15)) {
      setErrorMessage(
        'Job description is too brief to match against. Please include at least a role title and key skills or responsibilities (e.g., "Junior React Developer with TypeScript, REST APIs, and Git").'
      );
      return;
    }

    setIsAnalyzing(true);
    setElapsedSeconds(0);
    setAnalysisStep('Extracting resume text & validating inputs...');

    const elapsedInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const formData = new FormData();
    if (mode === 'file' && file) {
      formData.append('resume', file);
    } else {
      formData.append('resumeText', pastedResume);
    }
    formData.append('jd', jobDescription);

    const controller = new AbortController();
    const requestTimeout = setTimeout(() => controller.abort(), 120_000);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          Accept: 'application/x-ndjson',
        },
        body: formData,
        signal: controller.signal,
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isStream = contentType.includes('application/x-ndjson');
      const isJson = contentType.includes('application/json');

      if (!isStream && !isJson) {
        const rawText = await response.text().catch(() => '');
        const trimmed = rawText.trim();
        const lower = trimmed.toLowerCase();
        const isHtml =
          contentType.includes('text/html') ||
          lower.startsWith('<!doctype') ||
          lower.startsWith('<html');

        if (isHtml && lower.includes('starting server')) {
          throw new Error(
            'The analysis server is currently starting up or restarting. Please wait a few seconds and try again.'
          );
        }

        throw new Error(
          isHtml
            ? `The analysis service returned an unexpected HTML page (HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}). Please refresh and try again.`
            : `Unexpected response format from the analysis service (HTTP ${response.status}). Please try again.`
        );
      }

      if (isStream) {
        if (!response.ok) {
          throw new Error(`Failed to start resume analysis (HTTP ${response.status}).`);
        }
        if (!response.body) {
          throw new Error('Analysis stream was empty. Please try again.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalResult: ComprehensiveAnalysisResult | null = null;

        const processLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          if (
            trimmed.toLowerCase().startsWith('<!doctype') ||
            trimmed.toLowerCase().startsWith('<html')
          ) {
            throw new Error(
              'The analysis service returned an unexpected HTML response. Please refresh and try again.'
            );
          }

          let event: {
            type?: string;
            stage?: string;
            message?: string;
            error?: string;
            status?: number;
            data?: Partial<ComprehensiveAnalysisResult>;
          };
          try {
            event = JSON.parse(trimmed);
          } catch {
            throw new Error('Received a malformed progress packet from the analysis service.');
          }

          if (event.type === 'progress' && event.message) {
            setAnalysisStep(event.message);
          } else if (event.type === 'error') {
            throw new Error(
              event.error ||
                `Failed to complete resume analysis (HTTP ${event.status ?? 500}).`
            );
          } else if (event.type === 'result' && event.data) {
            const payload = event.data;
            if (
              typeof payload.overallMatchScore !== 'number' ||
              !payload.scoringRubric ||
              !payload.skillClassification
            ) {
              throw new Error(
                'Analysis response was incomplete. Please retry with your resume and job description.'
              );
            }
            finalResult = payload as ComprehensiveAnalysisResult;
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
              processLine(line);
            }
          }
          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) {
              processLine(buffer);
            }
            break;
          }
        }

        if (!finalResult) {
          throw new Error(
            'The analysis connection closed before the final report was delivered. Please try again.'
          );
        }

        setResult(finalResult);
        return;
      }

      // Standard JSON response path (e.g., 400 validation errors)
      let data: Partial<ComprehensiveAnalysisResult> & { error?: string; message?: string };
      try {
        data = await response.json();
      } catch {
        throw new Error(
          `Unable to read the analysis response (invalid JSON, HTTP ${response.status}). Please try again.`
        );
      }

      if (!response.ok) {
        const fallbackByStatus =
          response.status === 400
            ? 'Please check your resume and job description inputs and try again.'
            : response.status === 408
            ? 'The AI analysis timed out while processing. Please retry.'
            : response.status === 429
            ? 'Analysis rate limit reached. Please wait a moment and try again.'
            : response.status >= 500
            ? 'The AI analysis service encountered a temporary issue. Please try again.'
            : `Failed to complete resume analysis (HTTP ${response.status}).`;
        throw new Error(data?.error || data?.message || fallbackByStatus);
      }

      if (
        typeof data?.overallMatchScore !== 'number' ||
        !data.scoringRubric ||
        !data.skillClassification
      ) {
        throw new Error(
          'Analysis response was incomplete. Please retry with your resume and job description.'
        );
      }

      setResult(data as ComprehensiveAnalysisResult);
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setErrorMessage(
          'Resume analysis timed out after 120 seconds. Please retry or use pasted resume text.'
        );
      } else if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
        setErrorMessage(
          'Unable to reach the analysis server. Please verify your connection and try again.'
        );
      } else {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to analyze resume. Please try again.';
        setErrorMessage(message);
      }
    } finally {
      clearTimeout(requestTimeout);
      clearInterval(elapsedInterval);
      setIsAnalyzing(false);
      setAnalysisStep('');
      setElapsedSeconds(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPastedResume('');
    setJobDescription('');
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Background Radial Glow Effects */}
      <div className="bg-glow" style={{ top: '-10%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)' }}></div>
      <div className="bg-glow" style={{ bottom: '-10%', right: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)' }}></div>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '2rem 1.5rem 5rem', position: 'relative', zIndex: 10 }}>
        
        {/* Navigation Bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Prompt<span style={{ color: '#818cf8' }}>eck</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 700 }}>
                SCSE4041 Milestone 2
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.15rem' }}>
              AI-Powered Resume Feedback and Job Match Analyzer (Problem Pool C9)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <a 
              href="#analyzer-section" 
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '99px',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 15px -2px rgba(99, 102, 241, 0.4)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Start Analysis <ArrowRight size={15} />
            </a>
          </div>
        </header>

        {/* Dynamic View: Landing + Input Area OR Results Dashboard */}
        {!result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
            
            {/* MODULE 1: Landing Hero & Problem Exposition */}
            <section style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.4rem 1rem', borderRadius: '99px', color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                <Sparkles size={16} /> 6-Stage Prompt Engineering Pipeline • 35/25/15/15/10 Weighted Rubric
              </div>
              
              <h1 style={{ fontSize: '3.25rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
                Tailor Your Resume for Job Success with <span className="gradient-text">Evidence-Based AI</span>.
              </h1>
              
              <p style={{ fontSize: '1.15rem', color: '#9ca3af', lineHeight: 1.6, maxWidth: '720px', marginBottom: '2.5rem' }}>
                College students and freshers struggle to customize their resumes for specific roles. 
                Our system compares your resume against real job descriptions to provide indicative match scoring, 4-tier skill verification, Google X-Y-Z bullet rewrites, and actionable learning roadmaps.
              </p>

              {/* 3-Step Workflow Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', width: '100%', textAlign: 'left', marginBottom: '2rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ background: 'rgba(99, 102, 241, 0.2)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700, marginBottom: '1rem' }}>
                    1
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', marginBottom: '0.4rem' }}>
                    Ingest & Validate
                  </h4>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Upload text-based PDF or paste resume text alongside your target job description.
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ background: 'rgba(52, 211, 153, 0.2)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontWeight: 700, marginBottom: '1rem' }}>
                    2
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', marginBottom: '0.4rem' }}>
                    4-Tier Verification
                  </h4>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Classifies skills into Matched, Partially Matched, Missing, and Unverifiable claims.
                  </p>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                  <div style={{ background: 'rgba(251, 191, 36, 0.2)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', fontWeight: 700, marginBottom: '1rem' }}>
                    3
                  </div>
                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white', marginBottom: '0.4rem' }}>
                    Google X-Y-Z Bullets
                  </h4>
                  <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Optimizes weak bullets without hallucinating metrics, providing a downloadable PDF report.
                  </p>
                </div>
              </div>
            </section>

            {/* MODULE 2 & 3: Interactive Analysis Workspace */}
            <section id="analyzer-section" className="glass-panel" style={{ padding: '3rem 2.5rem', borderRadius: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                  Resume & Job Match Workspace
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>
                  Provide candidate resume data and target job description to run the multi-stage analysis engine.
                </p>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  color: '#fca5a5',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontWeight: 700 }}>Error:</span> {errorMessage}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2.5rem', width: '100%', marginBottom: '2.5rem' }}>
                
                {/* Left Column: MODULE 2 Resume Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontWeight: 700, fontSize: '1rem', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={18} color="#818cf8" /> 1. Candidate Resume
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Text-based PDF or Raw Text</span>
                  </div>

                  <ResumeUploader
                    onFileSelect={setFile}
                    selectedFile={file}
                    pastedText={pastedResume}
                    onPastedTextChange={setPastedResume}
                    mode={mode}
                    onModeChange={setMode}
                  />
                </div>

                {/* Right Column: MODULE 3 Job Description Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontWeight: 700, fontSize: '1rem', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Target size={18} color="#34d399" /> 2. Target Job Description
                    </label>
                    {jobDescription.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => setJobDescription('')}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Selector Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', alignSelf: 'center', marginRight: '0.2rem' }}>Examples:</span>
                    {JD_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(p.text)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: '#d1d5db',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder={`Paste target Job Description here, or click an example above.\n\nExample:\nRole: Junior Full-Stack Software Engineer\nRequired Skills: React, TypeScript, Node.js, PostgreSQL, Docker, Git\nResponsibilities: Build RESTful APIs, develop responsive UI components, and write unit tests.\nEducation: Bachelor's in Computer Science or equivalent project experience.`}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    style={{
                      width: '100%',
                      height: '240px',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      padding: '1rem',
                      color: 'white',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none',
                      fontSize: '0.875rem',
                      lineHeight: 1.5
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af' }}>
                    <span>{jobDescription.trim().split(/\s+/).filter(Boolean).length} words • {jobDescription.length} characters</span>
                    <span>Include role title, skills &amp; responsibilities</span>
                  </div>
                </div>

              </div>

              {/* Action Button & Step-by-Step Progress Feedback */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    width: '100%',
                    maxWidth: '450px',
                    background: isAnalyzing ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '14px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                    boxShadow: isAnalyzing ? 'none' : '0 10px 25px -4px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (isAnalyzing) return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    if (isAnalyzing) return;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={22} />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      Run AI Job Match Analysis <Sparkles size={20} />
                    </>
                  )}
                </button>

                {isAnalyzing && analysisStep && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>{analysisStep} ({elapsedSeconds}s)</span>
                  </div>
                )}
              </div>

            </section>
          </div>
        ) : (
          /* MODULE 6 & 7: Comprehensive Results Dashboard */
          <ResultsDashboard result={result} onReset={handleReset} />
        )}

      </div>
    </main>
  );
}
