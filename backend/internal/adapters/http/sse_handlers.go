package http

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// handleLiveCounterStream streams live engagement metrics over Server-Sent
// Events (agent_plan.md §5.2). Clients (EventSource) auto-reconnect when the
// connection is recycled by the server's write timeout.
func handleLiveCounterStream(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			respondError(w, http.StatusInternalServerError, "streaming unsupported")
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		ctx := r.Context()
		send := func() {
			b, _ := json.Marshal(liveCounts(ctx, pool))
			fmt.Fprintf(w, "data: %s\n\n", b)
			flusher.Flush()
		}
		send()
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				send()
			}
		}
	}
}

func liveCounts(ctx context.Context, pool *pgxpool.Pool) map[string]int {
	c := map[string]int{}
	get := func(key, q string) {
		var n int
		_ = pool.QueryRow(ctx, q).Scan(&n)
		c[key] = n
	}
	get("active_engagements", `SELECT COUNT(*) FROM engagement.engagements WHERE stage IN ('active','proposal')`)
	get("deliverables_in_flight", `SELECT COUNT(*) FROM engagement.deliverables WHERE status IN ('in_progress','pending_review','published')`)
	get("sectors_covered", `SELECT COUNT(DISTINCT sector) FROM engagement.engagements WHERE sector IS NOT NULL`)
	get("capabilities_deployed", `SELECT COUNT(*) FROM engagement.capability_deliveries`)
	get("team_members", `SELECT COUNT(*) FROM engagement.team_members`)
	get("decisions_logged", `SELECT COUNT(*) FROM engagement.decisions`)
	return c
}
