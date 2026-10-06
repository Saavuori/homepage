package api

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

// Target is one published app the homepage checks. The ID is the join key
// with the frontend's catalogue (frontend/src/apps.ts) — adding an app means
// adding it in both places.
type Target struct {
	ID  string
	URL string
}

var Targets = []Target{
	{ID: "hsl", URL: "https://hsl.saavuori.live"},
	{ID: "liikenne", URL: "https://liikenne.saavuori.live"},
	{ID: "finstat", URL: "https://finstat.saavuori.live"},
}

const (
	probeInterval = 60 * time.Second
	probeTimeout  = 8 * time.Second
)

// AppStatus is what /api/status reports per app. Version is only set when the
// app exposes a JSON /api/version with a "version" field; not every app does.
type AppStatus struct {
	ID        string    `json:"id"`
	Up        bool      `json:"up"`
	HTTPCode  int       `json:"httpCode,omitempty"`
	LatencyMs int64     `json:"latencyMs,omitempty"`
	Version   string    `json:"version,omitempty"`
	Error     string    `json:"error,omitempty"`
	CheckedAt time.Time `json:"checkedAt"`
}

// Prober checks every target on a fixed interval in the background, so a page
// load never waits on (or multiplies) requests to the apps — /api/status just
// returns the last result.
type Prober struct {
	targets []Target
	client  *http.Client

	mu      sync.RWMutex
	results map[string]AppStatus
}

func NewProber(targets []Target) *Prober {
	return &Prober{
		targets: targets,
		client:  &http.Client{Timeout: probeTimeout},
		results: make(map[string]AppStatus, len(targets)),
	}
}

func (p *Prober) Run(ctx context.Context) {
	p.probeAll(ctx)
	t := time.NewTicker(probeInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			p.probeAll(ctx)
		}
	}
}

func (p *Prober) probeAll(ctx context.Context) {
	var wg sync.WaitGroup
	for _, t := range p.targets {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s := p.probe(ctx, t)
			p.mu.Lock()
			p.results[t.ID] = s
			p.mu.Unlock()
		}()
	}
	wg.Wait()
}

func (p *Prober) probe(ctx context.Context, t Target) AppStatus {
	s := AppStatus{ID: t.ID, CheckedAt: time.Now().UTC()}

	start := time.Now()
	code, err := p.get(ctx, t.URL+"/", nil)
	s.LatencyMs = time.Since(start).Milliseconds()
	if err != nil {
		s.Error = err.Error()
		log.Printf("status: %s down: %v", t.ID, err)
		return s
	}
	s.HTTPCode = code
	s.Up = code < 400
	if !s.Up {
		log.Printf("status: %s answered HTTP %d", t.ID, code)
		return s
	}

	var v struct {
		Version string `json:"version"`
	}
	if code, err := p.get(ctx, t.URL+"/api/version", &v); err == nil && code == http.StatusOK {
		s.Version = v.Version
	}
	return s
}

// get fetches url and returns its status code, decoding a JSON body into out
// when out is non-nil. Bodies are capped so a misbehaving app cannot make the
// prober buffer something huge.
func (p *Prober) get(ctx context.Context, url string, out any) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("User-Agent", "saavuori.live-status/1")
	resp, err := p.client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	body := io.LimitReader(resp.Body, 1<<20)
	if out != nil && resp.StatusCode == http.StatusOK {
		if err := json.NewDecoder(body).Decode(out); err != nil {
			return resp.StatusCode, err
		}
		return resp.StatusCode, nil
	}
	_, _ = io.Copy(io.Discard, body)
	return resp.StatusCode, nil
}

// HandleStatus returns the latest result for every target, in catalogue
// order. A target not yet probed (the first round is still running) is
// omitted rather than reported as down.
func (p *Prober) HandleStatus(w http.ResponseWriter, _ *http.Request) {
	p.mu.RLock()
	apps := make([]AppStatus, 0, len(p.targets))
	for _, t := range p.targets {
		if s, ok := p.results[t.ID]; ok {
			apps = append(apps, s)
		}
	}
	p.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(map[string]any{"apps": apps})
}
