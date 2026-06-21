// Package seeds embeds the (non-secret) content seed SQL so the binary can
// populate a fresh database on startup. The production image is distroless
// (no psql), so seeding runs from inside the process. The user/admin seed is
// intentionally NOT here — admins are seeded from the SEED_ADMINS env var so no
// credentials live in the repository.
package seeds

import "embed"

//go:embed *.sql
var FS embed.FS
