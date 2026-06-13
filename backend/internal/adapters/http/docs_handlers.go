package http

import (
	"net/http"

	"xcreatives.com/backend/internal/apispec"
)

// handleOpenAPISpec serves the embedded OpenAPI document.
func handleOpenAPISpec() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
		w.Header().Set("Cache-Control", "public, max-age=300")
		_, _ = w.Write(apispec.OpenAPIYAML)
	}
}

// handleSwaggerUI serves a Swagger UI page (assets from CDN) for the spec.
func handleSwaggerUI() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Relax CSP for this page so the CDN-hosted Swagger UI assets load.
		w.Header().Set("Content-Security-Policy",
			"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; "+
				"style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; "+
				"font-src 'self' https://unpkg.com data:; connect-src 'self'")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(swaggerHTML))
	}
}

const swaggerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>XCreativs API — Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
  <link rel="icon" href="/favicon.ico"/>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true,
      });
    };
  </script>
</body>
</html>`
