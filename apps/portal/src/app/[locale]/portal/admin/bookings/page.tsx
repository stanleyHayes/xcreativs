"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@xc/api";
import CustomSelect from "@xc/ui/CustomSelect";
import { Calendar, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

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

const BOOKING_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
];

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
    return (
      <div className="space-y-6">
        <div className="portal-skeleton-x h-36" />
        <div className="portal-skeleton-x h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="portal-admin-header-x">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="portal-admin-icon-x">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <p className="portal-meta-x text-signal">Scheduling</p>
              <h1 className="font-display mt-2 text-4xl font-semibold leading-none">Consultation bookings</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/56">
                Confirm requested consultations, complete scheduled sessions, and keep booking context visible.
              </p>
            </div>
          </div>
          <CustomSelect value={filter} onChange={setFilter} options={BOOKING_FILTER_OPTIONS} variant="portal" className="sm:w-48" />
        </div>
      </section>

      {bookings.length === 0 ? (
        <PortalEmptyState
          icon={Clock}
          title="No bookings yet"
          description="New consultation requests will appear here with preferred dates, topic, and contact details."
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="portal-card-x p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`portal-chip-x ${statusColors[b.status] || ""}`}>
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
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {b.status === "requested" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "confirmed")}
                        disabled={updating === b.id}
                        className="portal-admin-action-x border-green-400/30 bg-green-400/15 text-green-300 hover:bg-green-400/25 disabled:opacity-50"
                      >
                        {updating === b.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, "cancelled")}
                        disabled={updating === b.id}
                        className="portal-admin-action-x portal-admin-action-danger-x disabled:opacity-50"
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
                      className="portal-admin-action-x border-blue-400/30 bg-blue-400/15 text-blue-300 hover:bg-blue-400/25 disabled:opacity-50"
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
