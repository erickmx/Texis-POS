package validation

import "testing"

func TestValidateDetailsRequest(t *testing.T) {
	title := "Maqueta"
	longTitle := make([]byte, 201)
	for i := range longTitle {
		longTitle[i] = 'a'
	}
	longTitleStr := string(longTitle)
	progress := 50
	outOfRange := 101
	negative := -1.0
	valid := 100.0

	tests := []struct {
		name      string
		title     *string
		progress  *int
		gasto     *float64
		service   *float64
		wantField string
		wantErrs  int
	}{
		{name: "all valid", title: &title, progress: &progress, gasto: &valid, service: &valid, wantErrs: 0},
		{name: "nil fields skipped", wantErrs: 0},
		{name: "progress 0 passes", progress: intPtr(0), wantErrs: 0},
		{name: "progress 100 passes", progress: intPtr(100), wantErrs: 0},
		{name: "progress 101 rejected", progress: &outOfRange, wantField: "progress_pct", wantErrs: 1},
		{name: "negative gasto rejected", gasto: &negative, wantField: "gasto_terceros", wantErrs: 1},
		{name: "negative service rejected", service: &negative, wantField: "service_fee", wantErrs: 1},
		{name: "title too long rejected", title: &longTitleStr, wantField: "title", wantErrs: 1},
		{name: "accumulates multiple errors", progress: &outOfRange, gasto: &negative, wantErrs: 2},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateDetailsRequest(tt.title, nil, tt.progress, tt.gasto, tt.service)
			if len(errs) != tt.wantErrs {
				t.Fatalf("got %d errors (%v), want %d", len(errs), errs, tt.wantErrs)
			}
			if tt.wantField != "" && errs[0].Field != tt.wantField {
				t.Fatalf("first error field = %q, want %q", errs[0].Field, tt.wantField)
			}
		})
	}
}

func intPtr(v int) *int { return &v }
