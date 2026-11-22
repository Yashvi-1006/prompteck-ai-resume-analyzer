import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { ComprehensiveAnalysisResult } from '@/lib/analysisTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toPdfSafeText(value: unknown): string {
  if (typeof value !== 'string') {
    if (value === null || value === undefined) return '';
    return String(value);
  }
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '--')
    .replace(/\u2022/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E\xA1-\xFF\n]/g, '')
    .trim();
}

function sanitizeFilenamePart(value: string, fallback: string): string {
  const cleaned = toPdfSafeText(value)
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return cleaned || fallback;
}

function getRatingLabel(score: number): string {
  if (score >= 80) return 'Strong Alignment';
  if (score >= 65) return 'Competitive Match';
  if (score >= 50) return 'Moderate Fit / Skill Gaps';
  return 'Low Match / Major Gaps';
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST /api/report with analysis result JSON.' },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: Partial<ComprehensiveAnalysisResult>;
    try {
      body = (await req.json()) as Partial<ComprehensiveAnalysisResult>;
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload provided for PDF report generation.' },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body.overallMatchScore !== 'number' ||
      !body.scoringRubric ||
      !body.skillClassification
    ) {
      return NextResponse.json(
        {
          error:
            'Incomplete analysis data. Please run a resume analysis before downloading the PDF report.',
        },
        { status: 400 }
      );
    }

    const result = body as ComprehensiveAnalysisResult;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const PAGE_W = 210;
    const MARGIN_X = 15;
    const CONTENT_W = PAGE_W - MARGIN_X * 2;
    const BOTTOM_Y = 278;
    let y = 16;

    const ensureSpace = (neededMm: number) => {
      if (y + neededMm > BOTTOM_Y) {
        doc.addPage();
        y = 18;
      }
    };

    const writeWrapped = (
      text: string,
      options?: {
        x?: number;
        maxWidth?: number;
        fontSize?: number;
        style?: 'normal' | 'bold' | 'italic';
        color?: [number, number, number];
        lineHeight?: number;
      }
    ) => {
      const safe = toPdfSafeText(text);
      if (!safe) return;
      const x = options?.x ?? MARGIN_X;
      const maxWidth = options?.maxWidth ?? CONTENT_W;
      const fontSize = options?.fontSize ?? 10;
      const style = options?.style ?? 'normal';
      const color = options?.color ?? [31, 41, 55];
      const lineHeight = options?.lineHeight ?? fontSize * 0.45;

      doc.setFont('helvetica', style);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);

      const lines = doc.splitTextToSize(safe, maxWidth) as string[];
      for (const line of lines) {
        ensureSpace(lineHeight + 1);
        doc.text(line, x, y);
        y += lineHeight;
      }
    };

    const drawSectionHeading = (title: string, subtitle?: string) => {
      ensureSpace(16);
      y += 3;
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.6);
      doc.line(MARGIN_X, y, MARGIN_X + CONTENT_W, y);
      y += 5;
      writeWrapped(title, {
        fontSize: 13,
        style: 'bold',
        color: [30, 27, 75],
        lineHeight: 6,
      });
      if (subtitle) {
        writeWrapped(subtitle, {
          fontSize: 8.5,
          style: 'italic',
          color: [107, 114, 128],
          lineHeight: 4.2,
        });
      }
      y += 2;
    };

    // 1. Header Banner
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, PAGE_W, 30, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('Prompteck | AI Resume Analysis Report', MARGIN_X, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(199, 210, 254);
    doc.text(
      'SCSE4041 Prompt Engineering Milestone 2  |  Evidence-Based Job Match Evaluation',
      MARGIN_X,
      20
    );
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toISOString().split('T')[0]}`, MARGIN_X, 25.5);

    y = 38;

    // 2. Candidate Profile & Target Role Box
    const candidateName = toPdfSafeText(result.candidateProfile?.candidateName) || 'Candidate';
    const targetRole = toPdfSafeText(result.candidateProfile?.targetJobTitle) || 'Target Role';
    const expLevel = toPdfSafeText(result.candidateProfile?.experienceLevel) || 'Entry / General';
    const eduList = (result.candidateProfile?.educationSummary ?? [])
      .map(toPdfSafeText)
      .filter(Boolean);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    const metaHeight = eduList.length > 0 ? 24 : 18;
    doc.roundedRect(MARGIN_X, y, CONTENT_W, metaHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Candidate: ${candidateName}`, MARGIN_X + 4, y + 6.5);
    doc.text(`Target Role: ${targetRole} (${expLevel})`, MARGIN_X + 4, y + 12.5);
    if (eduList.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const eduText = doc.splitTextToSize(`Education: ${eduList.join(' | ')}`, CONTENT_W - 8);
      doc.text(eduText[0] ?? '', MARGIN_X + 4, y + 18.5);
    }
    y += metaHeight + 6;

    // 3. Overall Match Score & Executive Summary
    const score = Math.round(result.overallMatchScore);
    const scoreColor: [number, number, number] =
      score >= 80 ? [16, 185, 129] : score >= 60 ? [217, 119, 6] : [220, 38, 38];

    ensureSpace(32);
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(MARGIN_X, y, CONTENT_W, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${score}%`, MARGIN_X + 6, y + 14);

    doc.setFontSize(11);
    doc.setTextColor(30, 27, 75);
    doc.text(`Indicative Job Match Score - ${getRatingLabel(score)}`, MARGIN_X + 32, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `Matched: ${result.skillClassification.matched.length}   |   Partial: ${result.skillClassification.partiallyMatched.length}   |   Missing: ${result.skillClassification.missing.length}   |   Unverifiable: ${result.skillClassification.unverifiable.length}`,
      MARGIN_X + 32,
      y + 15.5
    );
    doc.setFontSize(7.5);
    doc.text(
      'Calculated programmatically using fixed 35 / 25 / 15 / 15 / 10 weighted criteria.',
      MARGIN_X + 32,
      y + 20.5
    );
    y += 30;

    if (result.executiveSummary) {
      writeWrapped('Executive Summary', {
        fontSize: 10.5,
        style: 'bold',
        color: [30, 27, 75],
        lineHeight: 5,
      });
      writeWrapped(result.executiveSummary, {
        fontSize: 9.5,
        color: [55, 65, 81],
        lineHeight: 4.6,
      });
      y += 3;
    }

    // 4. Weighted Scoring Rubric Breakdown
    drawSectionHeading(
      'Weighted Scoring Rubric (35 / 25 / 15 / 15 / 10)',
      result.meta?.scoringMethodology ||
        'Evaluated programmatically across 5 weighted evidence categories.'
    );

    const rubricEntries = [
      { label: 'Technical Skills Alignment', data: result.scoringRubric.technicalSkills },
      {
        label: 'Experience & Practical Responsibilities',
        data: result.scoringRubric.experience,
      },
      { label: 'Developer Tools & Platforms', data: result.scoringRubric.toolsAndTech },
      { label: 'Education & Academic Qualifications', data: result.scoringRubric.education },
      { label: 'Projects & Practical Exposure', data: result.scoringRubric.projects },
    ];

    for (const entry of rubricEntries) {
      const fbLines = doc.splitTextToSize(
        toPdfSafeText(entry.data?.feedback || 'No feedback provided.'),
        CONTENT_W - 6
      ) as string[];
      const blockHeight = 14 + fbLines.length * 4.2;
      ensureSpace(blockHeight);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${entry.label} (${entry.data.weight}% Weight)`, MARGIN_X, y);

      doc.setTextColor(79, 70, 229);
      doc.text(
        `${entry.data.score}/100  (${entry.data.weightedScore} pts)`,
        MARGIN_X + CONTENT_W,
        y,
        { align: 'right' }
      );
      y += 3;

      // Progress bar
      doc.setFillColor(229, 231, 235);
      doc.rect(MARGIN_X, y, CONTENT_W, 2.2, 'F');
      const fillRgb: [number, number, number] =
        entry.data.score >= 70
          ? [16, 185, 129]
          : entry.data.score >= 50
          ? [245, 158, 11]
          : [239, 68, 68];
      doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
      doc.rect(MARGIN_X, y, (CONTENT_W * Math.max(0, Math.min(100, entry.data.score))) / 100, 2.2, 'F');
      y += 5.5;

      writeWrapped(entry.data.feedback || '', {
        x: MARGIN_X + 2,
        maxWidth: CONTENT_W - 4,
        fontSize: 8.5,
        color: [75, 85, 99],
        lineHeight: 4.1,
      });
      y += 2;
    }

    // 5. 4-Tier Evidence-Based Skill Classification
    drawSectionHeading(
      'Evidence-Based 4-Tier Skill Classification',
      'Strict textual verification across Matched, Partially Matched, Missing, and Unverifiable claims.'
    );

    const renderSkillGroup = (
      title: string,
      color: [number, number, number],
      items: Array<{ heading: string; detail: string; note?: string }>
    ) => {
      ensureSpace(12);
      writeWrapped(`${title} (${items.length})`, {
        fontSize: 10.5,
        style: 'bold',
        color,
        lineHeight: 5.2,
      });

      if (items.length === 0) {
        writeWrapped('None identified in this category.', {
          x: MARGIN_X + 3,
          fontSize: 8.5,
          style: 'italic',
          color: [107, 114, 128],
          lineHeight: 4.2,
        });
        y += 2;
        return;
      }

      for (const item of items) {
        ensureSpace(12);
        writeWrapped(`- ${item.heading}`, {
          x: MARGIN_X + 2,
          maxWidth: CONTENT_W - 4,
          fontSize: 9.2,
          style: 'bold',
          color: [31, 41, 55],
          lineHeight: 4.4,
        });
        if (item.detail) {
          writeWrapped(item.detail, {
            x: MARGIN_X + 5,
            maxWidth: CONTENT_W - 8,
            fontSize: 8.5,
            color: [75, 85, 99],
            lineHeight: 4.0,
          });
        }
        if (item.note) {
          writeWrapped(item.note, {
            x: MARGIN_X + 5,
            maxWidth: CONTENT_W - 8,
            fontSize: 8.2,
            style: 'italic',
            color: [107, 114, 128],
            lineHeight: 3.9,
          });
        }
        y += 1.5;
      }
      y += 2;
    };

    renderSkillGroup(
      'Matched Skills',
      [5, 150, 105],
      (result.skillClassification.matched ?? []).map((m) => ({
        heading: m.skill,
        detail: m.evidence,
        note: m.context ? `Context: ${m.context}` : undefined,
      }))
    );

    renderSkillGroup(
      'Partially Matched Skills',
      [217, 119, 6],
      (result.skillClassification.partiallyMatched ?? []).map((p) => ({
        heading: p.skill,
        detail: `Evidence: ${p.partialEvidence}`,
        note: p.missingAspect ? `Missing Aspect: ${p.missingAspect}` : undefined,
      }))
    );

    renderSkillGroup(
      'Missing Skills',
      [220, 38, 38],
      (result.skillClassification.missing ?? []).map((ms) => ({
        heading: `${ms.skill} [${ms.importance} Gap]`,
        detail: ms.reason,
      }))
    );

    renderSkillGroup(
      'Unverifiable Claims',
      [126, 34, 206],
      (result.skillClassification.unverifiable ?? []).map((u) => ({
        heading: u.skill,
        detail: u.claim,
        note: u.reason ? `Verification Note: ${u.reason}` : undefined,
      }))
    );

    // 6. Resume Bullet Point Optimizations (Google X-Y-Z)
    if ((result.bulletPointImprovements ?? []).length > 0) {
      drawSectionHeading(
        'Resume Bullet Point Optimization (Google X-Y-Z Formula)',
        'Uses honest bracketed metric placeholders [X%] instead of fabricated numbers.'
      );

      for (const b of result.bulletPointImprovements) {
        ensureSpace(22);
        writeWrapped(`Target Requirement: ${b.relevantRequirement}`, {
          fontSize: 8.5,
          style: 'bold',
          color: [79, 70, 229],
          lineHeight: 4.2,
        });
        writeWrapped(`Original: "${b.originalBullet}"`, {
          x: MARGIN_X + 3,
          maxWidth: CONTENT_W - 6,
          fontSize: 8.5,
          style: 'italic',
          color: [107, 114, 128],
          lineHeight: 4.1,
        });
        writeWrapped(`Improved (X-Y-Z): "${b.improvedBullet}"`, {
          x: MARGIN_X + 3,
          maxWidth: CONTENT_W - 6,
          fontSize: 8.8,
          style: 'bold',
          color: [17, 24, 39],
          lineHeight: 4.3,
        });
        writeWrapped(`Why this works: ${b.explanation}`, {
          x: MARGIN_X + 3,
          maxWidth: CONTENT_W - 6,
          fontSize: 8.2,
          color: [75, 85, 99],
          lineHeight: 4.0,
        });
        y += 3;
      }
    }

    // 7. Personalized Skill-Gap Learning Roadmap
    drawSectionHeading('Personalized Skill-Gap Learning Roadmap');

    if ((result.personalizedRecommendations?.immediateActions ?? []).length > 0) {
      writeWrapped('Immediate Fixes (Today)', {
        fontSize: 10,
        style: 'bold',
        color: [79, 70, 229],
        lineHeight: 5,
      });
      for (const act of result.personalizedRecommendations.immediateActions) {
        writeWrapped(`- ${act}`, {
          x: MARGIN_X + 3,
          maxWidth: CONTENT_W - 6,
          fontSize: 8.8,
          color: [55, 65, 81],
          lineHeight: 4.2,
        });
      }
      y += 2;
    }

    if ((result.personalizedRecommendations?.shortTermRoadmap ?? []).length > 0) {
      writeWrapped('Phased Learning Milestones', {
        fontSize: 10,
        style: 'bold',
        color: [5, 150, 105],
        lineHeight: 5,
      });
      for (const m of result.personalizedRecommendations.shortTermRoadmap) {
        ensureSpace(10);
        writeWrapped(`- ${m.milestone} (${m.timeline})`, {
          x: MARGIN_X + 3,
          maxWidth: CONTENT_W - 6,
          fontSize: 9,
          style: 'bold',
          color: [31, 41, 55],
          lineHeight: 4.3,
        });
        writeWrapped(m.focus, {
          x: MARGIN_X + 6,
          maxWidth: CONTENT_W - 9,
          fontSize: 8.5,
          color: [75, 85, 99],
          lineHeight: 4.1,
        });
      }
      y += 2;
    }

    if ((result.personalizedRecommendations?.portfolioAdvice ?? []).length > 0) {
      writeWrapped('Portfolio & GitHub Strategy', {
        fontSize: 10,
        style: 'bold',
        color: [217, 119, 6],
        lineHeight: 5,
      });
      for (const adv of result.personalizedRecommendations.portfolioAdvice) {
        writeWrapped(`- ${adv}`, {
          x: MARGIN_X + 3,
          maxWidth: CONTENT_W - 6,
          fontSize: 8.8,
          color: [55, 65, 81],
          lineHeight: 4.2,
        });
      }
      y += 2;
    }

    // 8. AI-Tailored Professional Summary
    if (result.tailoredSummary) {
      drawSectionHeading('AI-Tailored Professional Summary');
      writeWrapped(`"${result.tailoredSummary}"`, {
        x: MARGIN_X + 2,
        maxWidth: CONTENT_W - 4,
        fontSize: 9.5,
        style: 'italic',
        color: [30, 27, 75],
        lineHeight: 4.6,
      });
    }

    // 9. Page numbers & footer on every page
    const totalPages = doc.getNumberOfPages();
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      doc.setPage(pageNum);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(MARGIN_X, 284, MARGIN_X + CONTENT_W, 284);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(
        'Prompteck AI Resume Feedback & Job Match Analyzer (SCSE4041 Milestone 2)',
        MARGIN_X,
        289
      );
      doc.text(`Page ${pageNum} of ${totalPages}`, MARGIN_X + CONTENT_W, 289, {
        align: 'right',
      });
    }

    const pdfArrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    if (pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer was empty.');
    }

    const safeName = sanitizeFilenamePart(candidateName, 'Candidate');
    const filename = `Prompteck_Resume_Report_${safeName}_${score}pct.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('PDF report generation failed:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to generate PDF analysis report.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
