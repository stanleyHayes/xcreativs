"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@xc/api";
import type { AssessmentTemplateResponse, AssessmentSessionResponse } from "@xc/api/types";
import BannerWatermark from "@xc/ui/BannerWatermark";
import EmptyState from "@xc/ui/EmptyState";
import { BarChart3, ArrowRight, CheckCircle, RotateCcw, TrendingUp, Shield, Database, Server, Cog, Target, AlertTriangle } from "lucide-react";

interface AssessmentTemplate {
  id: string;
  title?: string;
  description?: string;
}

interface AssessmentOption {
  value: number;
  label: string;
}

interface AssessmentQuestion {
  id: string;
  dimension: string;
  question_text: string;
  options: AssessmentOption[];
}

interface AssessmentResults {
  scores?: Record<string, number>;
  overall_score: number;
  max_possible: number;
  percentage: number;
  recommendation_summary: string;
}

interface DimensionScore {
  score: number;
  max: number;
  pct: number;
}

const dimensionIcons: Record<string, React.ElementType> = {
  strategy: Target,
  data: Database,
  infrastructure: Server,
  security: Shield,
  operations: Cog,
};

const dimensionLabels: Record<string, string> = {
  strategy: "Strategy",
  data: "Data",
  infrastructure: "Infrastructure",
  security: "Security",
  operations: "Operations",
};

export default function ReadinessAssessmentPage() {
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Session state
  const [step, setStep] = useState<"intro" | "questions" | "results">("intro");
  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getAssessmentTemplate("digital-readiness")
      .then((res: AssessmentTemplateResponse) => {
        setTemplate((res.template as AssessmentTemplate | undefined) || null);
        setQuestions((res.questions as AssessmentQuestion[] | undefined) || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load assessment. Please try again later.");
        setLoading(false);
      });
  }, []);

  async function startAssessment() {
    if (!email || !template) return;
    try {
      const res = (await api.createAssessmentSession({
        template_id: template.id,
        email,
        organization,
      })) as AssessmentSessionResponse;
      setSessionId(res.session_id);
      setStep("questions");
    } catch {
      setError("Failed to start assessment.");
    }
  }

  function selectAnswer(value: number) {
    const q = questions[currentQIndex];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  }

  function nextQuestion() {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((i) => i + 1);
    } else {
      finishAssessment();
    }
  }

  async function finishAssessment() {
    setSubmitting(true);
    const answerEntries = Object.entries(answers).map(([question_id, value]) => ({
      question_id,
      value,
    }));
    try {
      const res = (await api.submitAssessmentAnswers(sessionId, { answers: answerEntries })) as AssessmentResults;
      setResults(res);
      setStep("results");
    } catch {
      setError("Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("intro");
    setSessionId("");
    setAnswers({});
    setCurrentQIndex(0);
    setResults(null);
    setEmail("");
    setOrganization("");
  }

  if (loading) {
    return (
      <main className="shell-x py-20">
        <p className="text-gravity/60">Loading assessment...</p>
      </main>
    );
  }

  if (error && step === "intro") {
    return (
      <main className="shell-x py-20">
        <EmptyState
          icon={AlertTriangle}
          title="Assessment failed to load"
          description="We couldn't load the assessment right now. Please try again shortly."
        />
      </main>
    );
  }

  return (
    <main className="shell-x relative overflow-hidden py-20">
      <BannerWatermark icon={BarChart3} />
      <div className="relative max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <p className="context-label-x">Readiness diagnostic</p>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">{template?.title || "Digital Systems Readiness Assessment"}</h1>
        <p className="mt-4 text-lg text-gravity/60">{template?.description}</p>
      </div>

      <div className="mt-12 max-w-2xl">
        {step === "intro" && (
          <IntroStep
            email={email}
            organization={organization}
            setEmail={setEmail}
            setOrganization={setOrganization}
            onStart={startAssessment}
          />
        )}
        {step === "questions" && (
          <QuestionStep
            questions={questions}
            currentQIndex={currentQIndex}
            answers={answers}
            onSelect={selectAnswer}
            onNext={nextQuestion}
            submitting={submitting}
          />
        )}
        {step === "results" && results && (
          <ResultsStep results={results} questions={questions} onReset={reset} />
        )}
      </div>
    </main>
  );
}

function IntroStep({
  email,
  organization,
  setEmail,
  setOrganization,
  onStart,
}: {
  email: string;
  organization: string;
  setEmail: (v: string) => void;
  setOrganization: (v: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="panel-x-soft p-6">
        <h2 className="font-semibold mb-4">Before we begin</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organisation.com"
              className="field-x"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organisation</label>
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your organisation"
              className="field-x"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-gravity/50">
        <CheckCircle className="w-4 h-4" />
        <span>15 questions · 5 dimensions · ~4 minutes</span>
      </div>
      <button
        onClick={onStart}
        disabled={!email}
        className="btn-x disabled:opacity-50"
      >
        Start Assessment <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function QuestionStep({
  questions,
  currentQIndex,
  answers,
  onSelect,
  onNext,
  submitting,
}: {
  questions: AssessmentQuestion[];
  currentQIndex: number;
  answers: Record<string, number>;
  onSelect: (value: number) => void;
  onNext: () => void;
  submitting: boolean;
}) {
  const q = questions[currentQIndex];
  const selected = answers[q.id];
  const progress = ((currentQIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gravity/50">
        <span>Question {currentQIndex + 1} of {questions.length}</span>
        <span className="capitalize">{dimensionLabels[q.dimension] || q.dimension}</span>
      </div>
      <div className="h-1 bg-gravity/10 rounded-full overflow-hidden">
        <div className="h-full bg-purple-400 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="panel-x p-6">
        <h2 className="text-lg font-semibold leading-relaxed">{q.question_text}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt: AssessmentOption) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                selected === opt.value
                  ? "border-purple-400 bg-purple-400/10"
                  : "border-hairline bg-foundation hover:border-purple-400/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={selected === undefined || submitting}
        className="btn-x disabled:opacity-50"
      >
        {currentQIndex === questions.length - 1 ? (submitting ? "Calculating..." : "Finish") : "Next"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ResultsStep({ results, questions, onReset }: { results: AssessmentResults; questions: AssessmentQuestion[]; onReset: () => void }) {
  const { scores, overall_score, max_possible, percentage, recommendation_summary } = results;

  // Group scores by dimension
  const dimensionScores: Record<string, DimensionScore> = {};
  questions.forEach((q: AssessmentQuestion) => {
    if (!dimensionScores[q.dimension]) {
      dimensionScores[q.dimension] = { score: 0, max: 0, pct: 0 };
    }
    dimensionScores[q.dimension].max += 5;
  });
  Object.entries(scores || {}).forEach(([dim, score]) => {
    if (dimensionScores[dim]) {
      dimensionScores[dim].score = score as number;
      dimensionScores[dim].pct = Math.round(((score as number) / dimensionScores[dim].max) * 100);
    }
  });

  const getGrade = (pct: number) => {
    if (pct >= 80) return { label: "Advanced", color: "text-green-400", bg: "bg-green-400/10" };
    if (pct >= 60) return { label: "Developing", color: "text-yellow-400", bg: "bg-yellow-400/10" };
    if (pct >= 40) return { label: "Emerging", color: "text-orange-400", bg: "bg-orange-400/10" };
    return { label: "Foundational", color: "text-red-400", bg: "bg-red-400/10" };
  };

  const overallGrade = getGrade(percentage);

  return (
    <div className="space-y-8">
      <div className="panel-x-soft p-8 text-center">
        <p className="text-sm font-medium text-gravity/50">Overall readiness score</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="text-5xl font-bold">{percentage}%</div>
          <div className={`px-3 py-1 rounded text-sm font-medium ${overallGrade.bg} ${overallGrade.color}`}>
            {overallGrade.label}
          </div>
        </div>
        <p className="mt-2 text-sm text-gravity/50">
          {overall_score} of {max_possible} points
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(dimensionScores).map(([dim, data]: [string, DimensionScore]) => {
          const Icon = dimensionIcons[dim] || Target;
          const grade = getGrade(data.pct);
          return (
            <div key={dim} className="card-x p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-gravity/40" />
                <span className="text-sm font-medium capitalize">{dimensionLabels[dim] || dim}</span>
              </div>
              <div className="text-2xl font-bold">{data.pct}%</div>
              <div className="mt-1 text-xs text-gravity/50">{data.score} / {data.max} points</div>
              <div className={`mt-3 inline-block px-2 py-0.5 rounded text-xs font-medium ${grade.bg} ${grade.color}`}>
                {grade.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-x p-6">
        <h3 className="font-semibold mb-3">Recommendation</h3>
        <p className="text-gravity/70 leading-relaxed">{recommendation_summary}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-signal hover:underline"
        >
          <RotateCcw className="w-4 h-4" /> Retake assessment
        </button>
        <Link
          href="/contact"
          className="btn-x"
        >
          <TrendingUp className="w-4 h-4" /> Book a discovery call
        </Link>
      </div>
    </div>
  );
}
