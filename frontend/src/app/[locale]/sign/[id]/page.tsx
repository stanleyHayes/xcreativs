"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FileSignature, Loader2, CheckCircle, AlertTriangle, Pen, Type, Eraser, Download } from "lucide-react";

interface SigningData {
  id: string;
  document_title: string;
  document_body: string;
  recipient_name: string;
  recipient_org: string;
  status: string;
  expires_at: string | null;
  signed_document_url?: string;
  signed_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

export default function SignPage() {
  const { id } = useParams();
  const [data, setData] = useState<SigningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_URL}/api/v1/sign/${id}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((d) => {
        if (d.status === "already_signed") {
          setCompleted(true);
        }
        setData(d);
        setTypedName(d.recipient_name || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      isDrawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const end = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener("touchmove", move, { passive: true });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [mode, loading]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function getSignatureData(): string {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas) return "";
      return canvas.toDataURL("image/png");
    }
    return typedName.trim();
  }

  async function handleSubmit() {
    const signatureData = getSignatureData();
    if (!signatureData || (mode === "type" && signatureData.length < 2)) {
      setError("Please provide your signature.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/sign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_data: signatureData }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Submission failed" }));
        throw new Error(err.error);
      }
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gravity">
        <Loader2 className="w-8 h-8 animate-spin text-signal" />
      </main>
    );
  }

  if (completed) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gravity px-6">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Signature Complete</h1>
          <p className="text-white/60 mb-6">
            {data?.recipient_name ? `Thank you, ${data.recipient_name}.` : "Thank you."} Your signature has been recorded for <strong className="text-white">{data?.document_title}</strong>.
          </p>
          {data?.signed_document_url && (
            <a
              href={data.signed_document_url}
              download={`${data?.document_title || "document"}_signed.png`}
              className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download signed document
            </a>
          )}
        </div>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gravity px-6">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Unable to load</h1>
          <p className="text-white/60">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gravity">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <FileSignature className="w-8 h-8 text-signal" />
          <div>
            <h1 className="text-2xl font-bold">{data?.document_title}</h1>
            <p className="text-sm text-white/50">
              Requested by XCreativs Technologies
              {data?.recipient_name && ` · For ${data.recipient_name}`}
              {data?.recipient_org && `, ${data.recipient_org}`}
            </p>
          </div>
        </div>

        {/* Document body */}
        <div className="border border-white/10 rounded-lg bg-foundation p-6 mb-8">
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-white/80 leading-relaxed">
              {data?.document_body}
            </pre>
          </div>
        </div>

        {/* Signature area */}
        <div className="border border-white/10 rounded-lg bg-foundation p-6">
          <h2 className="font-semibold mb-4">Sign below</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode("draw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === "draw" ? "bg-signal text-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Pen className="w-3.5 h-3.5" />
              Draw
            </button>
            <button
              onClick={() => setMode("type")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mode === "type" ? "bg-signal text-black" : "bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Type
            </button>
          </div>

          {mode === "draw" ? (
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-[200px] bg-white rounded border border-white/20 cursor-crosshair touch-none"
              />
              <button
                onClick={clearCanvas}
                className="absolute top-2 right-2 p-1.5 bg-white/90 text-black rounded hover:bg-white transition-colors"
                title="Clear"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <input
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Type your full name"
              className="w-full bg-transparent border-b-2 border-white/20 focus:border-signal text-2xl font-serif py-4 text-center outline-none transition-colors"
            />
          )}

          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-signal text-black px-5 py-3 rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
            {submitting ? "Submitting..." : "Sign Document"}
          </button>
        </div>
      </div>
    </main>
  );
}
