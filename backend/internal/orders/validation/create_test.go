package validation

import (
	"strings"
	"testing"
)

func TestValidateCreateRequest(t *testing.T) {
	title := "Maqueta"
	longTitle := strings.Repeat("a", 201)
	longCustomer := strings.Repeat("c", 121)
	progress := 50
	zero := 0
	hundred := 100
	outOfRange := 101
	negative := -1.0
	amount := 100.0
	goodURL := "https://proj.supabase.co/storage/v1/object/public/inventory-images/a.png"
	badURL := "http://evil.example.com/a.png"

	tests := []struct {
		name        string
		customer    string
		title       *string
		progress    *int
		gasto       *float64
		service     *float64
		attachments []string
		wantErrs    int
		wantField   string
	}{
		{name: "all valid", customer: "Juan", title: &title, progress: &progress, gasto: &amount, service: &amount, attachments: []string{goodURL}, wantErrs: 0},
		{name: "minimal valid", customer: "Juan", wantErrs: 0},
		{name: "empty customer rejected", customer: "   ", wantField: "customer_name", wantErrs: 1},
		{name: "long customer rejected", customer: longCustomer, wantField: "customer_name", wantErrs: 1},
		{name: "long title rejected", customer: "Juan", title: &longTitle, wantField: "title", wantErrs: 1},
		{name: "progress 0 passes", customer: "Juan", progress: &zero, wantErrs: 0},
		{name: "progress 100 passes", customer: "Juan", progress: &hundred, wantErrs: 0},
		{name: "progress 101 rejected", customer: "Juan", progress: &outOfRange, wantField: "progress_pct", wantErrs: 1},
		{name: "negative gasto rejected", customer: "Juan", gasto: &negative, wantField: "gasto_terceros", wantErrs: 1},
		{name: "negative service rejected", customer: "Juan", service: &negative, wantField: "service_fee", wantErrs: 1},
		{name: "bad attachment url rejected", customer: "Juan", attachments: []string{goodURL, badURL}, wantField: "attachments", wantErrs: 1},
		{name: "accumulates multiple errors", customer: "", progress: &outOfRange, gasto: &negative, wantErrs: 3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateCreateRequest(tt.customer, tt.title, tt.progress, tt.gasto, tt.service, tt.attachments)
			if len(errs) != tt.wantErrs {
				t.Fatalf("got %d errors (%v), want %d", len(errs), errs, tt.wantErrs)
			}
			if tt.wantField != "" && errs[0].Field != tt.wantField {
				t.Fatalf("first error field = %q, want %q", errs[0].Field, tt.wantField)
			}
		})
	}
}
