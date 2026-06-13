// Package apispec embeds the generated OpenAPI document so it can be served at
// runtime (including from the distroless container). Regenerate with:
//
//	go run ./cmd/genopenapi > internal/apispec/openapi.yaml
package apispec

import _ "embed"

//go:embed openapi.yaml
var OpenAPIYAML []byte
