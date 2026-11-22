import { NextRequest, NextResponse } from 'next/server';
import {
  TransformerEngine,
  AnalysisPipelineError,
  AnalysisProgressEvent,
} from '@/lib/nlpEngine';
import { PDFParse } from 'pdf-parse';
import PDFParser from 'pdf2json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function extractPdfTextWithPdfParse(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

async function extractPdfTextWithPdf2Json(buffer: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    type PdfParserConstructor = new (context: unknown, needRawText?: number) => {
      on: (event: string, cb: (err?: { parserError?: unknown }) => void) => void;
      getRawTextContent: () => string;
      parseBuffer: (buf: Buffer) => void;
    };
    const PdfParserCtor = PDFParser as unknown as PdfParserConstructor;
    const pdfParser = new PdfParserCtor(null, 1);

    pdfParser.on('pdfParser_dataError', (errData) =>
      reject(errData?.parserError ?? new Error('PDF parsing error'))
    );
    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const rawText = pdfParser.getRawTextContent();
        const decoded = decodeURIComponent(rawText);
        resolve(decoded);
      } catch {
        resolve(pdfParser.getRawTextContent());
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const text = await extractPdfTextWithPdfParse(buffer);
    if (text && text.trim().length > 0) {
      return text;
    }
  } catch (err) {
    console.warn('Primary PDF parser (pdf-parse) failed, attempting pdf2json fallback:', err);
  }

  return extractPdfTextWithPdf2Json(buffer);
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST /api/analyze with multipart/form-data.' },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request payload. Expected multipart/form-data containing resume and jd.' },
        { status: 400 }
      );
    }

    const fileEntry = formData.get('resume');
    const file = fileEntry instanceof File ? fileEntry : null;
    const pastedResumeEntry = formData.get('resumeText');
    const pastedResume = typeof pastedResumeEntry === 'string' ? pastedResumeEntry : null;
    const jdEntry = formData.get('jd');
    const jd = typeof jdEntry === 'string' ? jdEntry : null;

    // Validation 1: Job Description
    if (!jd || !jd.trim()) {
      return NextResponse.json(
        { error: 'Missing job description. Please provide a target job description to benchmark against.' },
        { status: 400 }
      );
    }

    // Validation 2: Resume Content (either via file or text paste)
    let resumeText = '';

    if (file && file.size > 0) {
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json(
          { error: 'Unsupported file format. Please upload a valid text-based PDF (.pdf) file.' },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size exceeds maximum limit of 5MB. Please upload a smaller PDF.' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      try {
        resumeText = await extractTextFromPdfBuffer(buffer);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        return NextResponse.json(
          { error: 'Failed to parse PDF document. The file may be password protected or corrupted.' },
          { status: 400 }
        );
      }
    } else if (pastedResume && pastedResume.trim()) {
      resumeText = pastedResume.trim();
    } else {
      return NextResponse.json(
        { error: 'Please provide a resume by uploading a PDF or pasting the resume text.' },
        { status: 400 }
      );
    }

    // Validation 3: Check for empty extracted text (e.g., scanned PDF image)
    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        {
          error:
            'No readable text found in the PDF. This document appears to be a scanned image. Please upload a text-based PDF or paste your resume text directly.',
        },
        { status: 400 }
      );
    }

    // Validation 4: Minimum length and meaningful content checks
    const trimmedResume = resumeText.trim();
    if (trimmedResume.length < 30) {
      return NextResponse.json(
        {
          error:
            'Resume text is too brief to analyze (minimum 30 characters). Please upload a complete resume PDF or paste your skills, education, and project/experience details.',
        },
        { status: 400 }
      );
    }

    const trimmedJd = jd.trim();
    const jdWords = trimmedJd.split(/\s+/).filter(Boolean);
    if (trimmedJd.length < 10 || (jdWords.length < 2 && trimmedJd.length < 15)) {
      return NextResponse.json(
        {
          error:
            'Job description is too brief to match against. Please include at least a role title and key skills or responsibilities (for example: "Junior React Developer with TypeScript, REST APIs, and Git").',
        },
        { status: 400 }
      );
    }

    // Initialize and execute the AI Transformer Pipeline
    const bypassCache = req.nextUrl.searchParams.get('nocache') === '1';
    const wantsStream = (req.headers.get('accept') || '')
      .toLowerCase()
      .includes('application/x-ndjson');

    const nlpEngine = new TransformerEngine();

    if (!wantsStream) {
      const result = await nlpEngine.analyze(resumeText, jd, { bypassCache });
      return NextResponse.json(result, { status: 200 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const sendEvent = (payload: unknown) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        try {
          const result = await nlpEngine.analyze(resumeText, jd, {
            bypassCache,
            onProgress: (event: AnalysisProgressEvent) => {
              sendEvent({ type: 'progress', ...event });
            },
          });
          sendEvent({ type: 'result', data: result });
        } catch (err: unknown) {
          if (err instanceof AnalysisPipelineError) {
            console.error(
              `[POST /api/analyze stream] AnalysisPipelineError (${err.statusCode}): ${err.message}`
            );
            sendEvent({
              type: 'error',
              status: err.statusCode,
              error: err.message,
            });
          } else {
            const msg =
              err instanceof Error
                ? err.message
                : 'Internal server error while analyzing resume.';
            console.error(`[POST /api/analyze stream] Unexpected error: ${msg}`);
            sendEvent({
              type: 'error',
              status: 500,
              error: msg,
            });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    if (error instanceof AnalysisPipelineError) {
      console.error(
        `[POST /api/analyze] AnalysisPipelineError (${error.statusCode}): ${error.message}`
      );
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : 'Internal server error while analyzing resume.';
    console.error(`[POST /api/analyze] Unexpected error: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
