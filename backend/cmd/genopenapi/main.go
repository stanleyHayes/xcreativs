// Command genopenapi walks the live chi router and emits an OpenAPI 3 spec to
// stdout, so the API reference always matches the real routes.
//
//	go run ./cmd/genopenapi > api/openapi.yaml
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"xcreatives.com/backend/internal/adapters/db"
	httpadapter "xcreatives.com/backend/internal/adapters/http"
	"xcreatives.com/backend/internal/config"
	"xcreatives.com/backend/pkg/jwt"
	"xcreatives.com/backend/pkg/logger"
)

var paramRe = regexp.MustCompile(`\{([^/}]+)\}`)

func main() {
	cfg := &config.Config{
		Env:              "development",
		AllowedOrigins:   []string{"*"},
		JWTSecret:        "generator",
		JWTRefreshSecret: "generator",
	}
	log := logger.New("development")
	jwtGen := jwt.NewGenerator(cfg.JWTSecret, cfg.JWTRefreshSecret, 15*time.Minute, 30*24*time.Hour)
	router := httpadapter.NewRouter(cfg, log, nil, db.NewIdentityRepo(nil), jwtGen)

	// Collect (path -> method -> nil) from the real router.
	type op struct{ method, route string }
	var ops []op
	_ = chi.Walk(router.(chi.Routes), func(method, route string, _ http.Handler, _ ...func(http.Handler) http.Handler) error {
		if method == "" {
			return nil
		}
		ops = append(ops, op{method, route})
		return nil
	})

	byPath := map[string][]string{}
	for _, o := range ops {
		byPath[o.route] = append(byPath[o.route], o.method)
	}
	paths := make([]string, 0, len(byPath))
	for p := range byPath {
		paths = append(paths, p)
	}
	sort.Strings(paths)

	if len(os.Args) > 1 && os.Args[1] == "postman" {
		emitPostman(paths, byPath)
		return
	}

	var b strings.Builder
	b.WriteString(header)
	b.WriteString("paths:\n")
	for _, p := range paths {
		b.WriteString("  " + yamlKey(p) + ":\n")
		params := paramRe.FindAllStringSubmatch(p, -1)
		methods := byPath[p]
		sort.Strings(methods)
		for _, m := range methods {
			writeOp(&b, m, p, params)
		}
	}
	fmt.Print(b.String())
	_, _ = fmt.Fprintf(os.Stderr, "generated %d paths / %d operations\n", len(paths), len(ops))
}

func writeOp(b *strings.Builder, method, path string, params [][]string) {
	lm := strings.ToLower(method)
	b.WriteString("    " + lm + ":\n")
	b.WriteString("      tags: [" + tagFor(path) + "]\n")
	b.WriteString("      summary: " + method + " " + path + "\n")
	b.WriteString("      operationId: " + operationID(method, path) + "\n")
	if len(params) > 0 {
		b.WriteString("      parameters:\n")
		for _, pm := range params {
			b.WriteString("        - name: " + pm[1] + "\n")
			b.WriteString("          in: path\n")
			b.WriteString("          required: true\n")
			b.WriteString("          schema: { type: string }\n")
		}
	}
	if method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch {
		b.WriteString("      requestBody:\n")
		b.WriteString("        required: false\n")
		b.WriteString("        content:\n")
		if strings.Contains(path, "/uploads") || strings.Contains(path, "extract-file") {
			b.WriteString("          multipart/form-data:\n")
			b.WriteString("            schema:\n")
			b.WriteString("              type: object\n")
			b.WriteString("              properties: { file: { type: string, format: binary } }\n")
		} else {
			b.WriteString("          application/json:\n")
			b.WriteString("            schema: { type: object }\n")
		}
	}
	b.WriteString("      responses:\n")
	b.WriteString("        '200': { description: Success }\n")
	b.WriteString("        '400': { $ref: '#/components/responses/Error' }\n")
	b.WriteString("        '401': { $ref: '#/components/responses/Error' }\n")
	b.WriteString("        default: { $ref: '#/components/responses/Error' }\n")
}

// emitPostman writes a Postman v2.1 collection (folders per tag) to stdout.
func emitPostman(paths []string, byPath map[string][]string) {
	type pmURL struct {
		Raw  string   `json:"raw"`
		Host []string `json:"host"`
		Path []string `json:"path"`
	}
	type pmReq struct {
		Method string         `json:"method"`
		Header []any          `json:"header"`
		URL    pmURL          `json:"url"`
		Body   map[string]any `json:"body,omitempty"`
	}
	type pmItem struct {
		Name    string   `json:"name"`
		Request *pmReq   `json:"request,omitempty"`
		Item    []pmItem `json:"item,omitempty"`
	}

	folders := map[string]*pmItem{}
	var order []string
	for _, p := range paths {
		tag := tagFor(p)
		f, ok := folders[tag]
		if !ok {
			f = &pmItem{Name: tag}
			folders[tag] = f
			order = append(order, tag)
		}
		methods := byPath[p]
		sort.Strings(methods)
		for _, m := range methods {
			pmPath := strings.NewReplacer("{", ":", "}", "").Replace(p)
			var segs []string
			for _, s := range strings.Split(strings.TrimPrefix(pmPath, "/"), "/") {
				if s != "" {
					segs = append(segs, s)
				}
			}
			req := &pmReq{Method: m, Header: []any{}, URL: pmURL{Raw: "{{baseUrl}}" + pmPath, Host: []string{"{{baseUrl}}"}, Path: segs}}
			if m == http.MethodPost || m == http.MethodPut || m == http.MethodPatch {
				req.Body = map[string]any{"mode": "raw", "raw": "{}", "options": map[string]any{"raw": map[string]any{"language": "json"}}}
			}
			f.Item = append(f.Item, pmItem{Name: m + " " + p, Request: req})
		}
	}
	sort.Strings(order)
	var items []pmItem
	for _, t := range order {
		items = append(items, *folders[t])
	}
	collection := map[string]any{
		"info": map[string]any{
			"name":        "XCreativs Web Platform API",
			"schema":      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
			"description": "Generated from the live router. Set the {{baseUrl}} and {{token}} (Bearer JWT) collection variables.",
		},
		"auth":     map[string]any{"type": "bearer", "bearer": []map[string]any{{"key": "token", "value": "{{token}}", "type": "string"}}},
		"variable": []map[string]any{{"key": "baseUrl", "value": "http://localhost:8081"}, {"key": "token", "value": ""}},
		"item":     items,
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(collection)
	_, _ = fmt.Fprintf(os.Stderr, "generated Postman collection: %d folders / %d paths\n", len(items), len(paths))
}

func tagFor(path string) string {
	p := strings.TrimPrefix(path, "/api/v1/")
	p = strings.TrimPrefix(p, "/")
	seg := strings.SplitN(p, "/", 2)[0]
	seg = strings.SplitN(seg, "{", 2)[0]
	switch seg {
	case "", "healthz", "readyz":
		return "Health"
	case "auth":
		return "Auth"
	case "portal", "invoices", "notifications", "api-keys", "audit-log":
		return "Portal"
	case "admin":
		return "Admin"
	case "partner":
		return "Partner"
	case "tools", "visualizations", "document-intelligence", "assessments", "diagnostics", "estimates", "uploads", "live-counter":
		return "Tools"
	case "concierge":
		return "Concierge"
	case "careers", "talent-network":
		return "Careers"
	default:
		return "Public"
	}
}

func operationID(method, path string) string {
	s := strings.ToLower(method) + path
	s = strings.NewReplacer("/", "_", "{", "", "}", "", "-", "_", ".", "_").Replace(s)
	return strings.Trim(s, "_")
}

// yamlKey quotes the path key (curly braces are valid but quoting is safest).
func yamlKey(p string) string { return "\"" + p + "\"" }

const header = `openapi: 3.0.3
info:
  title: XCreativs Web Platform API
  version: "1.0"
  description: >
    REST API for the XCreativs platform. Bearer (JWT) auth is offered globally via the
    Authorize button; public endpoints ignore the token. Scoped API keys use the
    X-API-Key header. Generated from the live router — do not edit by hand;
    run ` + "`go run ./cmd/genopenapi > api/openapi.yaml`" + `.
servers:
  - url: http://localhost:8081
    description: Local
  - url: /
    description: Same origin
tags:
  - { name: Health }
  - { name: Auth }
  - { name: Public }
  - { name: Careers }
  - { name: Tools }
  - { name: Concierge }
  - { name: Portal }
  - { name: Partner }
  - { name: Admin }
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
    apiKeyAuth: { type: apiKey, in: header, name: X-API-Key }
  schemas:
    Error:
      type: object
      properties:
        error: { type: string }
  responses:
    Error:
      description: Error
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
security:
  - bearerAuth: []
`
