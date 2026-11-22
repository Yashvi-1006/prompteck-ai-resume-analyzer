'use client';

import { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  TrendingUp, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Award, 
  Briefcase, 
  GraduationCap, 
  Layers, 
  Code2, 
  ShieldAlert,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ComprehensiveAnalysisResult } from '@/lib/analysisTypes';

interface ResultsDashboardProps {
  result: ComprehensiveAnalysisResult;
  onReset: () => void;
}

export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'matched' | 'partial' | 'missing' | 'unverifiable'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // emerald green
    if (score >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Strong Alignment', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (score >= 65) return { label: 'Competitive Match', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
    if (score >= 50) return { label: 'Moderate Fit / Skill Gaps', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: 'Low Match / Major Gaps', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const badge = getScoreBadge(result.overallMatchScore);

  const handleCopyBullet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    setPdfError(null);
    setIsDownloadingPdf(true);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });

      const contentType = (response.headers.get('content-type') || '').toLowerCase();

      if (!response.ok) {
        if (contentType.includes('application/json')) {
          const errPayload = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(
            errPayload?.error || `PDF export failed (HTTP ${response.status}). Please try again.`
          );
        }
        throw new Error(`PDF export failed (HTTP ${response.status}). Please try again.`);
      }

      if (!contentType.includes('application/pdf')) {
        throw new Error('Server returned an unexpected format instead of a PDF file.');
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF file was empty. Please retry.');
      }

      const disposition = response.headers.get('content-disposition') || '';
      const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^\s";]+)/i);
      const filename = filenameMatch?.[1]?.replace(/"/g, '') || 'Prompteck_Resume_Analysis_Report.pdf';

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch (error: unknown) {
      console.error('PDF download error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to download PDF report. Please try again.';
      setPdfError(message);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', width: '100%' }}>
      
      {/* Top Banner & Security Flags if any */}
      {result.meta?.securityFlags && result.meta.securityFlags.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          color: '#fca5a5'
        }}>
          <ShieldAlert size={24} color="#ef4444" />
          <div style={{ fontSize: '0.9rem' }}>
            <strong>Security Alert: Prompt Injection Neutralized:</strong> The uploaded input contained embedded instructions designed to override system scoring. The analysis engine isolated and neutralized the attempt.
          </div>
        </div>
      )}

      {/* PDF Export Error Banner */}
      {pdfError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#fca5a5',
          fontSize: '0.9rem'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <div>
            <strong>PDF Export Error:</strong> {pdfError}
          </div>
        </div>
      )}

      {/* Hero Overview Card */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '99px', background: badge.bg, color: badge.color, fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: badge.color }}></span>
              {badge.label}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
              Job Match Evaluation
            </h2>
            {result.candidateProfile && (
              <div style={{ fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '0.5rem' }}>
                {result.candidateProfile.candidateName} • Target: {result.candidateProfile.targetJobTitle}
              </div>
            )}
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.6 }}>
              {result.executiveSummary}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: isDownloadingPdf ? 'rgba(99, 102, 241, 0.45)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: isDownloadingPdf ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.2s',
                fontSize: '0.9rem'
              }}
              onMouseOver={(e) => {
                if (!isDownloadingPdf) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isDownloadingPdf ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Generating PDF...
                </>
              ) : (
                <>
                  <Download size={18} /> Download Official PDF Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Circular Gauge & High-Level Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          
          {/* Main Indicative Match Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={getScoreColor(result.overallMatchScore)}
                  strokeWidth="10"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * result.overallMatchScore) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                />
              </svg>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: getScoreColor(result.overallMatchScore), display: 'block', lineHeight: 1 }}>
                  {result.overallMatchScore}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Indicative Match Score
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginTop: '0.25rem' }}>
                {result.overallMatchScore}% Compatibility
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Weighted 5-Category Formula
              </div>
            </div>
          </div>

          {/* Quick Skill Count Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Matched Skills</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{result.skillClassification.matched.length}</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>Partially Matched</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{result.skillClassification.partiallyMatched.length}</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Missing Skills</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{result.skillClassification.missing.length}</div>
            </div>
            <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 600 }}>Unverifiable Claims</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{result.skillClassification.unverifiable.length}</div>
            </div>
          </div>

        </div>
      </div>

      {/* MODULE 4: Configurable Weighted Scoring Rubric */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={22} color="#818cf8" />
            Official Weighted Scoring Rubric (35 / 25 / 15 / 15 / 10)
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            {result.meta?.scoringMethodology ||
              'Evaluated according to the SCSE4041 Prompt Engineering Milestone 2 multi-criteria specification.'}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <RubricRow
            icon={<Code2 size={18} color="#818cf8" />}
            title="Technical Skills Alignment"
            weight={result.scoringRubric.technicalSkills.weight}
            score={result.scoringRubric.technicalSkills.score}
            weightedScore={result.scoringRubric.technicalSkills.weightedScore}
            feedback={result.scoringRubric.technicalSkills.feedback}
          />
          <RubricRow
            icon={<Briefcase size={18} color="#34d399" />}
            title="Experience & Practical Responsibilities"
            weight={result.scoringRubric.experience.weight}
            score={result.scoringRubric.experience.score}
            weightedScore={result.scoringRubric.experience.weightedScore}
            feedback={result.scoringRubric.experience.feedback}
          />
          <RubricRow
            icon={<Layers size={18} color="#38bdf8" />}
            title="Developer Tools & Platforms"
            weight={result.scoringRubric.toolsAndTech.weight}
            score={result.scoringRubric.toolsAndTech.score}
            weightedScore={result.scoringRubric.toolsAndTech.weightedScore}
            feedback={result.scoringRubric.toolsAndTech.feedback}
          />
          <RubricRow
            icon={<GraduationCap size={18} color="#fbbf24" />}
            title="Education & Academic Qualifications"
            weight={result.scoringRubric.education.weight}
            score={result.scoringRubric.education.score}
            weightedScore={result.scoringRubric.education.weightedScore}
            feedback={result.scoringRubric.education.feedback}
          />
          <RubricRow
            icon={<FileText size={18} color="#f472b6" />}
            title="Projects & Practical Exposure"
            weight={result.scoringRubric.projects.weight}
            score={result.scoringRubric.projects.score}
            weightedScore={result.scoringRubric.projects.weightedScore}
            feedback={result.scoringRubric.projects.feedback}
          />
        </div>
      </div>

      {/* 4-Tier Evidence-Based Skill Classification */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={22} color="#818cf8" />
              Evidence-Based 4-Tier Skill Classification
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Classified by strict textual verification. Unverifiable claims are flagged when projects/work proof is missing.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <FilterButton label={`All (${result.skillClassification.matched.length + result.skillClassification.partiallyMatched.length + result.skillClassification.missing.length + result.skillClassification.unverifiable.length})`} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
            <FilterButton label={`Matched (${result.skillClassification.matched.length})`} active={activeTab === 'matched'} onClick={() => setActiveTab('matched')} color="#10b981" />
            <FilterButton label={`Partial (${result.skillClassification.partiallyMatched.length})`} active={activeTab === 'partial'} onClick={() => setActiveTab('partial')} color="#f59e0b" />
            <FilterButton label={`Missing (${result.skillClassification.missing.length})`} active={activeTab === 'missing'} onClick={() => setActiveTab('missing')} color="#ef4444" />
            <FilterButton label={`Unverifiable (${result.skillClassification.unverifiable.length})`} active={activeTab === 'unverifiable'} onClick={() => setActiveTab('unverifiable')} color="#c084fc" />
          </div>
        </div>

        {/* Classification Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          
          {(activeTab === 'all' || activeTab === 'matched') && result.skillClassification.matched.map((item, idx) => (
            <div key={`m-${idx}`} style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#34d399', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} /> {item.skill}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 600 }}>Matched</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>{item.evidence}</p>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                Context: {item.context}
              </div>
            </div>
          ))}

          {(activeTab === 'all' || activeTab === 'partial') && result.skillClassification.partiallyMatched.map((item, idx) => (
            <div key={`p-${idx}`} style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#fbbf24', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} /> {item.skill}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 600 }}>Partially Matched</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>
                <strong>Evidence:</strong> {item.partialEvidence}
              </p>
              <div style={{ fontSize: '0.8rem', color: '#f87171', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <strong>Missing Aspect:</strong> {item.missingAspect}
              </div>
            </div>
          ))}

          {(activeTab === 'all' || activeTab === 'missing') && result.skillClassification.missing.map((item, idx) => (
            <div key={`ms-${idx}`} style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#f87171', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XCircle size={16} /> {item.skill}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 600 }}>
                  {item.importance} Gap
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>{item.reason}</p>
            </div>
          ))}

          {(activeTab === 'all' || activeTab === 'unverifiable') && result.skillClassification.unverifiable.map((item, idx) => (
            <div key={`u-${idx}`} style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#c084fc', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={16} /> {item.skill}
                </span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: 600 }}>Unverifiable Claim</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#d1d5db', lineHeight: 1.5 }}>{item.claim}</p>
              <div style={{ fontSize: '0.8rem', color: '#e9d5ff', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <strong>Verification Note:</strong> {item.reason}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* MODULE 5: High-Impact Resume Bullet Point Optimizations */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={22} color="#818cf8" />
            Resume Bullet Point Optimization (Google X-Y-Z Formula)
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
            Transformed into <em>&ldquo;Accomplished [X] as measured by [Y], by doing [Z]&rdquo;</em>. Uses honest bracketed placeholders <code>[X%]</code> instead of inventing metrics.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {result.bulletPointImprovements.map((bullet) => (
            <div key={bullet.id} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Target Requirement: {bullet.relevantRequirement}
                </span>
                <button
                  onClick={() => handleCopyBullet(bullet.id, bullet.improvedBullet)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: copiedId === bullet.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: copiedId === bullet.id ? '#34d399' : '#d1d5db',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {copiedId === bullet.id ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Improved</>}
                </button>
              </div>

              {/* Before and After Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, marginBottom: '0.35rem' }}>ORIGINAL BULLET POINT:</div>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.5 }}>
                    &ldquo;{bullet.originalBullet}&rdquo;
                  </p>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '0.35rem' }}>IMPROVED GOOGLE X-Y-Z BULLET:</div>
                  <p style={{ fontSize: '0.875rem', color: '#ffffff', fontWeight: 500, lineHeight: 1.5 }}>
                    &ldquo;{bullet.improvedBullet}&rdquo;
                  </p>
                </div>
              </div>

              {/* Pedagogical Explanation */}
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                <strong>Why this works:</strong> {bullet.explanation}
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Personalized Skill-Gap Remediation Roadmap */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={22} color="#818cf8" />
          Personalized Skill-Gap Learning Roadmap
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Immediate Actions */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#818cf8', marginBottom: '1rem' }}>
              Immediate Fixes (Today)
            </h4>
            <ul style={{ display: 'grid', gap: '0.75rem', paddingLeft: '1.25rem', color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {result.personalizedRecommendations.immediateActions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>

          {/* Staged Roadmap */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', marginBottom: '1rem' }}>
              Phased Learning Milestones
            </h4>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {result.personalizedRecommendations.shortTermRoadmap.map((item, i) => (
                <div key={i} style={{ borderLeft: '2px solid #34d399', paddingLeft: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>{item.milestone} • {item.timeline}</div>
                  <div style={{ fontSize: '0.85rem', color: '#e5e7eb', marginTop: '0.2rem' }}>{item.focus}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio & GitHub Advice */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fbbf24', marginBottom: '1rem' }}>
              Portfolio & GitHub Strategy
            </h4>
            <ul style={{ display: 'grid', gap: '0.75rem', paddingLeft: '1.25rem', color: '#d1d5db', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {result.personalizedRecommendations.portfolioAdvice.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* AI-Tailored Professional Summary */}
      <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
          AI-Tailored Professional Summary
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
          A customized, high-impact 2–3 sentence career summary tailored specifically for this Job Description.
        </p>
        <div style={{
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '1.5rem',
          borderRadius: '12px',
          color: '#e0e7ff',
          fontSize: '0.95rem',
          lineHeight: 1.7,
          fontStyle: 'italic'
        }}>
          &ldquo;{result.tailoredSummary}&rdquo;
        </div>
      </div>

      {/* Actions Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: isDownloadingPdf ? 'rgba(99, 102, 241, 0.45)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: 'white',
            border: 'none',
            padding: '0.85rem 2rem',
            borderRadius: '99px',
            fontWeight: 600,
            cursor: isDownloadingPdf ? 'not-allowed' : 'pointer',
            fontSize: '1rem'
          }}
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 className="animate-spin" size={18} /> Generating PDF...
            </>
          ) : (
            <>
              <Download size={18} /> Download Official PDF Report
            </>
          )}
        </button>
        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#e5e7eb',
            padding: '0.85rem 2rem',
            borderRadius: '99px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Analyze Another Resume
        </button>
      </div>

    </div>
  );
}

function RubricRow({
  icon,
  title,
  weight,
  score,
  weightedScore,
  feedback
}: {
  icon: React.ReactNode;
  title: string;
  weight: number;
  score: number;
  weightedScore: number;
  feedback: string;
}) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, color: 'white' }}>
          {icon}
          <span>{title}</span>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', color: '#9ca3af', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
            {weight}% Weight
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171' }}>
            {score}/100
          </span>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginLeft: '0.5rem' }}>
            ({weightedScore} pts)
          </span>
        </div>
      </div>

      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
            borderRadius: '99px',
            transition: 'width 1s ease-out'
          }}
        />
      </div>

      <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.2rem' }}>{feedback}</p>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  color
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 0.85rem',
        borderRadius: '8px',
        border: active ? `1px solid ${color || '#6366f1'}` : '1px solid rgba(255,255,255,0.1)',
        background: active ? (color ? `${color}20` : 'rgba(99, 102, 241, 0.2)') : 'transparent',
        color: active ? (color || 'white') : '#9ca3af',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {label}
    </button>
  );
}
