package orders

import "testing"

func TestComputeIvaCents(t *testing.T) {
	tests := []struct {
		name         string
		serviceCents int
		want         int
	}{
		{name: "design vector service 450", serviceCents: 45000, want: 7200},
		{name: "zero service", serviceCents: 0, want: 0},
		{name: "rounds to nearest cent", serviceCents: 333, want: 53}, // 53.28 -> 53
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ComputeIvaCents(tt.serviceCents); got != tt.want {
				t.Fatalf("ComputeIvaCents(%d) = %d, want %d", tt.serviceCents, got, tt.want)
			}
		})
	}
}

func TestComputeTotalCents(t *testing.T) {
	tests := []struct {
		name         string
		gastoCents   int
		serviceCents int
		want         int
	}{
		{name: "design vector gasto 1200 service 450", gastoCents: 120000, serviceCents: 45000, want: 172200},
		{name: "gasto untaxed by IVA", gastoCents: 100000, serviceCents: 0, want: 100000},
		{name: "both zero", gastoCents: 0, serviceCents: 0, want: 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ComputeTotalCents(tt.gastoCents, tt.serviceCents); got != tt.want {
				t.Fatalf("ComputeTotalCents(%d, %d) = %d, want %d", tt.gastoCents, tt.serviceCents, got, tt.want)
			}
		})
	}
}

func TestDollarsToCents(t *testing.T) {
	v := 1200.0
	if got := dollarsToCents(&v); got != 120000 {
		t.Fatalf("dollarsToCents(1200) = %d, want 120000", got)
	}
	if got := dollarsToCents(nil); got != 0 {
		t.Fatalf("dollarsToCents(nil) = %d, want 0", got)
	}
}
