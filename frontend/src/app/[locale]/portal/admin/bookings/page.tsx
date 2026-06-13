"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Calendar, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

const statusColors: Record<string, string> = {
  requested: "text-yellow-400 bg-yellow-400/10",
  confirmed: "text-green-400 bg-green-400/10",
  completed: "text-blue-400 bg-blue-400/10",
  cancelled: "text-red-400 bg-red-400/10",
};

const statusLabels: Record<string, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface ListBookingsResponse {
  bookings?: Booking[];
}

interface Booking {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  organization: string;
  topic: string;
  preferred_date: string | null;
  preferred_time: string;
  duration_minutes: number;
  status: string;
  scheduled_at: string | null;
  notes: string;
  created_at: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = (await api.listBookings(filter || undefined)) as ListBookingsResponse;
      setBookings(res.bookings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    async function loadBookings() {
      await fetchBookings();
    }
    void loadBookings();
  }, [fetchBookings]);

  async function handleUpdateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      await api.updateBooking(id, { status });
      await fetchBookings();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update";
      alert(message);
    } finally {
      setUpdating(null);
    }
  }

  const fullName = (b: Booking) =>
    [b.first_name, b.last_name].filter(Boolean).join(" ") || "Unknown";

  if (loading) {
    return <div className="text-white/60">Loading bookings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-signal" />
          <h1 className="text-2xl font-bold">Consultation Bookings</h1>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gravity border border-white/10 rounded px-3 py-2 text-sm text-white"
        >
          <option value="">All statuses</option>
          {Object.keys(statusLabels).map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      {bookings.length === 0 ? (
        <div className="border border-white/10 rounded-lg p-8 text-center text-white/40">
          <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="border border-white/10 rounded-lg bg-foundation p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[b.status] || ""}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                    <span className="text-xs text-white/30 uppercase">{b.topic}</span>
                    {b.duration_minutes > 0 && (
                      <span className="text-xs text-white/30">{b.duration_minutes} min</span>
                    )}
                  </div>
                  <p className="font-medium">{fullName(b)}</p>
                  <p className="text-sm text-white/50">{b.email}</p>
                  {b.organization && <p className="text-sm text-white/40">{b.organization}</p>}
                  <p className="text-sm text-white/40 mt-1">
                    {b.preferred_date
                      ? `Preferred: ${new Date(b.preferred_date).toLocaleDateString()} ${b.preferred_time}`
                      : `Preferred time: ${b.preferred_time || "Not specified"}`}
                    {b.scheduled_at && ` · Scheduled: ${new Date(b.scheduled_at).toLocaleString()}`}
                  </p>
                  {b.notes && <p className="text-xs text-white/30 mt-1">{b.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {b.status === "requested" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "confirmed")}
                        disabled={updating === b.id}
                        className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "cancelled")}
                        disabled={updating === b.id}
                        className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3" />
                        Cancel
                      </button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus(b.id, "completed")}
                      disabled={updating === b.id}
                      className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Complete
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-white/30">
                Submitted {new Date(b.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
