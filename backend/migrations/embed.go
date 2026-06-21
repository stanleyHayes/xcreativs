// Package migrations embeds the SQL migration files so the binary can apply
// them on startup. The production image is distroless (no migrate CLI), so
// auto-migration runs from inside the process via this embedded filesystem.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
