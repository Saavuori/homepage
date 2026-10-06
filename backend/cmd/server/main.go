package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"homepage/internal/api"
)

// The homepage is a static page listing the published apps, plus one thing a
// static page cannot do on its own: check from the server whether each app is
// actually up. The browser cannot — the apps live on other origins and most
// do not send CORS headers — so a background prober does it and the page reads
// the result from /api/status.
func main() {
	log.Println("Starting homepage backend...")

	prober := api.NewProber(api.Targets)
	go prober.Run(context.Background())

	mux := http.NewServeMux()
	mux.HandleFunc("/api/version", api.HandleGetVersion)
	mux.HandleFunc("/api/health", api.HandleHealth)
	mux.HandleFunc("/api/status", prober.HandleStatus)

	// Embedded frontend build (production image only — empty in a dev checkout,
	// where Vite serves the frontend and proxies /api here instead).
	mux.HandleFunc("/", api.ServeStatic)

	// Default to :8081, which the frontend dev proxy targets; PORT overrides it
	// in the container.
	addr := ":8081"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}
	log.Printf("Server listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
