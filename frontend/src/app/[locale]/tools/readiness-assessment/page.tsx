"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BarChart3, ArrowRight, CheckCircle, RotateCcw, TrendingUp, Shield, Database, Server, Cog, Target } from "lucide-react";

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
  const [template, setTemplate] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Session state
  const [step, setStep] = useState<"intro" | "questions" | "results">("intro");
  const [sessionId, setSessionId] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getAssessmentTemplate("digital-readiness")
      .then((res) => {
        setTemplate(res.template);
        setQuestions(res.questions || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load assessment. Please try again later.");
        setLoading(false);
      });
  }, []);

  async function startAssessment() {
    if (!email) return;
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
      const res = await api.submitAssessmentAnswers(sessionId, { answers: answerEntries });
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
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
        <p className="text-gravity/60">Loading assessment...</p>
      </main>
    );
  }

  if (error && step === "intro") {
    return (
      <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">§ 07 · Interactive Tool</p>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold">{template?.title || "Digital Systems Readiness Assessment"}</h1>
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
      <div className="border border-hairline rounded-lg p-6 bg-soft">
        <h2 className="font-semibold mb-4">Before we begin</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organisation.com"
              className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Organisation</label>
            <input
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Your organisation"
              className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
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
        className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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
  questions: any[];
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

      <div className="border border-hairline rounded-lg p-6 bg-foundation">
        <h2 className="text-lg font-semibold leading-relaxed">{q.question_text}</h2>
        <div className="mt-6 space-y-3">
          {q.options.map((opt: any) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`w-full text-left px-4 py-3 rounded border transition-colors text-sm ${
                selected === opt.value
                  ? "border-purple-400 bg-purple-400/10"
                  : "border-hairline hover:border-purple-400/50"
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
        className="bg-signal text-white px-6 py-3 rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {currentQIndex === questions.length - 1 ? (submitting ? "Calculating..." : "Finish") : "Next"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ResultsStep({ results, questions, onReset }: { results: any; questions: any[]; onReset: () => void }) {
  const { scores, overall_score, max_possible, percentage, recommendation_summary } = results;

  // Group scores by dimension
  const dimensionScores: Record<string, { score: number; max: number; pct: number }> = {};
  questions.forEach((q: any) => {
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
      <div className="border border-hairline rounded-lg p-8 bg-soft text-center">
        <p className="text-sm text-gravity/50 uppercase tracking-wider">Overall Readiness Score</p>
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
        {Object.entries(dimensionScores).map(([dim, data]: [string, any]) => {
          const Icon = dimensionIcons[dim] || Target;
          const grade = getGrade(data.pct);
          return (
            <div key={dim} className="border border-hairline rounded-lg p-5 bg-foundation">
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

      <div className="border border-hairline rounded-lg p-6 bg-foundation">
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
        <a
          href="/contact"
          className="flex items-center gap-2 bg-signal text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <TrendingUp className="w-4 h-4" /> Book a discovery call
        </a>
      </div>
    </div>
  );
}
