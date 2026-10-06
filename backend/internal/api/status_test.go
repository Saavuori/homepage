package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProbe(t *testing.T) {
	withVersion := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/version" {
			json.NewEncoder(w).Encode(map[string]string{"version": "v1.2.3"})
			return
		}
		w.Write([]byte("<html></html>"))
	}))
	defer withVersion.Close()

	// Like ratikka: the page is up, but there is no /api/version.
	noVersion := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Write([]byte("<html></html>"))
	}))
	defer noVersion.Close()

	// Like Caddy in front of a stopped container.
	badGateway := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer badGateway.Close()

	gone := httptest.NewServer(http.NotFoundHandler())
	goneURL := gone.URL
	gone.Close()

	p := NewProber([]Target{
		{ID: "a", URL: withVersion.URL},
		{ID: "b", URL: noVersion.URL},
		{ID: "c", URL: badGateway.URL},
		{ID: "d", URL: goneURL},
	})
	p.probeAll(context.Background())

	cases := []struct {
		id      string
		up      bool
		version string
		code    int
	}{
		{"a", true, "v1.2.3", 200},
		{"b", true, "", 200},
		{"c", false, "", 502},
		{"d", false, "", 0},
	}
	for _, c := range cases {
		got := p.results[c.id]
		if got.Up != c.up || got.Version != c.version || got.HTTPCode != c.code {
			t.Errorf("%s: got up=%v version=%q code=%d, want up=%v version=%q code=%d",
				c.id, got.Up, got.Version, got.HTTPCode, c.up, c.version, c.code)
		}
	}
	if p.results["d"].Error == "" {
		t.Errorf("d: unreachable target should report an error")
	}
}

func TestHandleStatusKeepsCatalogueOrderAndSkipsUnprobed(t *testing.T) {
	p := NewProber([]Target{{ID: "x"}, {ID: "y"}, {ID: "z"}})
	p.results["z"] = AppStatus{ID: "z", Up: true}
	p.results["x"] = AppStatus{ID: "x"}

	rec := httptest.NewRecorder()
	p.HandleStatus(rec, httptest.NewRequest(http.MethodGet, "/api/status", nil))

	var body struct{ Apps []AppStatus }
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if len(body.Apps) != 2 || body.Apps[0].ID != "x" || body.Apps[1].ID != "z" {
		t.Fatalf("got %+v, want x then z", body.Apps)
	}
}
