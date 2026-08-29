package orders

import (
	"encoding/json"
	"testing"
)

func TestSpecialRequestDetails_Unmarshal(t *testing.T) {
	tests := []struct {
		name    string
		payload string
		want    int
	}{
		{
			name:    "object embed (to-one, current PostgREST shape)",
			payload: `{"id":"a","folio":1,"status":"pending","is_special_request":true,"total_amount":0,"created_at":"2026-01-01T00:00:00Z","special_requests_details":{"title":"Maqueta","progress_pct":40}}`,
			want:    1,
		},
		{
			name:    "array embed (forward compatibility)",
			payload: `{"id":"b","folio":2,"status":"pending","is_special_request":true,"total_amount":0,"created_at":"2026-01-01T00:00:00Z","special_requests_details":[{"title":"A"},{"title":"B"}]}`,
			want:    2,
		},
		{
			name:    "null embed",
			payload: `{"id":"c","folio":3,"status":"pending","is_special_request":true,"total_amount":0,"created_at":"2026-01-01T00:00:00Z","special_requests_details":null}`,
			want:    0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var so SpecialOrder
			if err := json.Unmarshal([]byte(tt.payload), &so); err != nil {
				t.Fatalf("unmarshal special order: %v", err)
			}
			if got := len(so.SpecialRequestsDetails); got != tt.want {
				t.Fatalf("len(SpecialRequestsDetails) = %d, want %d", got, tt.want)
			}
		})
	}
}
