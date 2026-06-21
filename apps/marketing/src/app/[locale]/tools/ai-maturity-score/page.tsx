"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@xc/api";
import type { AssessmentTemplateResponse } from "@xc/api/types";
import BannerWatermark from "@xc/ui/BannerWatermark";
import { Brain, ArrowRight, CheckCircle, RotateCcw, TrendingUp, Target, Database, Users, Shield } from "lucide-react";

interface AssessmentTemplate {
  id: string;
  title?: string;
  description?: string;
}

interface QuestionOption {
  value: number;
  label: string;
}

interface AssessmentQuestion {
  id: string;
  dimension: string;
  question_text: string;
  options: QuestionOption[];
}

interface AssessmentResults {
  scores?: Record<string, number>;
  overall_score: number;
  max_possible: number;
  percentage: number;
  recommendation_summary: string;
}

const dimensionIcons: Record<string, React.ElementType> = {
  strategy: Target,
  data: Database,
  talent: Users,
  governance: Shield,
};

const dimensionLabels: Record<string, string> = {
  strategy: "Strategy",
  data: "Data",
  talent: "Talent & Infrastructure",
  governance: "Governance",
};

export default function AIMaturityScorePage() {
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [step, setStep] = useState<"intro" | "questions" | "results">("intro");
  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getAssessmentTemplate("ai-maturity")
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
      const res = await api.createAssessmentSession({
        template_id: template.id,
        email,
        organization,
      });
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
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="shell-x relative overflow-hidden py-20">
      <BannerWatermark icon={Brain} />
      <div className="relative max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-signal" />
          <p className="context-label-x">AI maturity diagnostic</p>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight lg:text-5xl">{template?.title || "AI Maturity Score"}</h1>
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
        <span>12 questions · 4 dimensions · ~3 minutes</span>
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
        <div className="h-full bg-signal transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="panel-x p-6">
        <h2 className="text-lg font-semibold leading-relaxed">{q.question_text}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt: QuestionOption) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                selected === opt.value
                  ? "border-signal bg-signal/10"
                  : "border-hairline bg-foundation hover:border-signal/50"
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

  const dimensionScores: Record<string, { score: number; max: number; pct: number }> = {};
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

  const getTier = (pct: number) => {
    if (pct >= 80) return { label: "AI-Native", color: "text-green-400", bg: "bg-green-400/10", desc: "AI is embedded in strategy and operations." };
    if (pct >= 60) return { label: "AI-Enabled", color: "text-yellow-400", bg: "bg-yellow-400/10", desc: "Strong foundation with targeted expansion ahead." };
    if (pct >= 40) return { label: "AI-Aware", color: "text-orange-400", bg: "bg-orange-400/10", desc: "Initial adoption with significant room to grow." };
    return { label: "AI-Nascent", color: "text-red-400", bg: "bg-red-400/10", desc: "Early stage — strategic intervention recommended." };
  };

  const overallTier = getTier(percentage);

  return (
    <div className="space-y-8">
      <div className="panel-x-soft p-8 text-center">
        <p className="text-sm font-medium text-gravity/50">AI maturity score</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          <div className="text-5xl font-bold">{percentage}%</div>
          <div className={`px-3 py-1 rounded text-sm font-medium ${overallTier.bg} ${overallTier.color}`}>
            {overallTier.label}
          </div>
        </div>
        <p className="mt-2 text-sm text-gravity/50">
          {overall_score} of {max_possible} points · {overallTier.desc}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(dimensionScores).map(([dim, data]) => {
          const Icon = dimensionIcons[dim] || Target;
          const tier = getTier(data.pct);
          return (
            <div key={dim} className="card-x p-5">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-gravity/40" />
                <span className="text-sm font-medium">{dimensionLabels[dim] || dim}</span>
              </div>
              <div className="text-2xl font-bold">{data.pct}%</div>
              <div className="mt-1 text-xs text-gravity/50">{data.score} / {data.max} points</div>
              <div className={`mt-3 inline-block px-2 py-0.5 rounded text-xs font-medium ${tier.bg} ${tier.color}`}>
                {tier.label}
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
        <button onClick={onReset} className="flex items-center gap-2 text-sm text-signal hover:underline">
          <RotateCcw className="w-4 h-4" /> Retake assessment
        </button>
        <Link href="/contact" className="btn-x">
          <TrendingUp className="w-4 h-4" /> Discuss your results
        </Link>
      </div>
    </div>
  );
}
