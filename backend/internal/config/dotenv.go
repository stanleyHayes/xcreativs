package config

import (
	"bufio"
	"os"
	"strings"
)

// LoadEnvFiles reads simple KEY=VALUE files (e.g. a Render Secret File mounted
// at /etc/secrets/.env, or a local ./.env) and sets any variable that is not
// already present in the process environment.
//
// Variables already in the environment ALWAYS win, so values injected by the
// platform (Render Blueprint envVars, fromDatabase/fromService wiring, and
// generated secrets) are never overridden — the file only fills the gaps.
// Missing/unreadable files are silently ignored. Lines may be blank, "# comments",
// optionally prefixed with "export ", and values may be wrapped in single or
// double quotes.
func LoadEnvFiles(paths ...string) {
	for _, p := range paths {
		f, err := os.Open(p)
		if err != nil {
			continue
		}
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			line = strings.TrimPrefix(line, "export ")
			key, val, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			key = strings.TrimSpace(key)
			val = strings.TrimSpace(val)
			if len(val) >= 2 && (val[0] == '"' || val[0] == '\'') && val[len(val)-1] == val[0] {
				val = val[1 : len(val)-1]
			}
			if key == "" {
				continue
			}
			if _, exists := os.LookupEnv(key); !exists {
				_ = os.Setenv(key, val)
			}
		}
		_ = f.Close()
	}
}
