import { NextRequest, NextResponse } from 'next/server';
import { TransformerEngine } from '@/lib/nlpEngine';
import PDFParser from 'pdf2json';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const pastedResume = formData.get('resumeText') as string | null;
    const jd = formData.get('jd') as string | null;

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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size exceeds maximum limit of 5MB. Please upload a smaller PDF.' },
          { status: 400 }
        );
      }

      // Convert file to buffer and extract text
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      try {
        resumeText = await new Promise<string>((resolve, reject) => {
          const pdfParser = new (PDFParser as any)(null, 1);

          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            try {
              const rawText = pdfParser.getRawTextContent();
              // decode URI encoded characters if present
              const decoded = decodeURIComponent(rawText);
              resolve(decoded);
            } catch {
              resolve(pdfParser.getRawTextContent());
            }
          });

          pdfParser.parseBuffer(buffer);
        });
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
          error: 'No readable text found in the PDF. This document appears to be a scanned image. Please upload a text-based PDF or paste your resume text directly.' 
        },
        { status: 400 }
      );
    }

    // Validation 4: Minimum length check
    if (resumeText.trim().length < 30) {
      return NextResponse.json(
        { error: 'Resume text is too brief to analyze. Please provide a complete resume with project and skills details.' },
        { status: 400 }
      );
    }

    if (jd.trim().length < 20) {
      return NextResponse.json(
        { error: 'Job description is too brief. Please provide a detailed job description with role requirements.' },
        { status: 400 }
      );
    }

    // Initialize and execute the AI Transformer Pipeline
    const nlpEngine = new TransformerEngine();
    const result = await nlpEngine.analyze(resumeText, jd);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Analysis API runtime error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while analyzing resume.' },
      { status: 500 }
    );
  }
}
