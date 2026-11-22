export interface RubricCategory {
  weight: number;
  score: number;
  weightedScore: number;
  feedback: string;
}

export interface MatchedSkill {
  skill: string;
  evidence: string;
  context: string;
}

export interface PartiallyMatchedSkill {
  skill: string;
  partialEvidence: string;
  missingAspect: string;
}

export interface MissingSkill {
  skill: string;
  importance: 'Critical' | 'Important' | 'Nice-to-have' | string;
  reason: string;
}

export interface UnverifiableSkill {
  skill: string;
  claim: string;
  reason: string;
}

export interface BulletPointImprovement {
  id: string;
  originalBullet: string;
  improvedBullet: string;
  relevantRequirement: string;
  explanation: string;
  frameworkApplied?: string;
}

export interface RoadmapMilestone {
  milestone: string;
  focus: string;
  timeline: string;
}

export interface ComprehensiveAnalysisResult {
  overallMatchScore: number;
  executiveSummary: string;
  tailoredSummary: string;
  scoringRubric: {
    technicalSkills: RubricCategory;
    experience: RubricCategory;
    toolsAndTech: RubricCategory;
    education: RubricCategory;
    projects: RubricCategory;
  };
  skillClassification: {
    matched: MatchedSkill[];
    partiallyMatched: PartiallyMatchedSkill[];
    missing: MissingSkill[];
    unverifiable: UnverifiableSkill[];
  };
  bulletPointImprovements: BulletPointImprovement[];
  personalizedRecommendations: {
    immediateActions: string[];
    shortTermRoadmap: RoadmapMilestone[];
    portfolioAdvice: string[];
  };
  candidateProfile?: {
    candidateName: string;
    targetJobTitle: string;
    experienceLevel: string;
    educationSummary: string[];
  };
  meta?: {
    securityFlags?: string[];
    engine?: 'gemini' | 'deterministic';
    model?: string;
    pipelineStages?: string[];
    scoringMethodology?: string;
    cached?: boolean;
    durationMs?: number;
    stageTimingsMs?: Record<string, number>;
  };
}
