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

func TestUpdateDetailsRequest_NullableFields(t *testing.T) {
	tests := []struct {
		name          string
		payload       string
		deadlineSet   bool
		deadlineNil   bool
		progressSet   bool
		progressNil   bool
		progressValue int
	}{
		{
			name:        "absent fields stay unset",
			payload:     `{"title":"x"}`,
			deadlineSet: false, progressSet: false,
		},
		{
			name:        "explicit nulls are set with nil value",
			payload:     `{"deadline":null,"progress_pct":null}`,
			deadlineSet: true, deadlineNil: true, progressSet: true, progressNil: true,
		},
		{
			name:        "values are set with parsed content",
			payload:     `{"deadline":"2026-12-01T12:00:00Z","progress_pct":40}`,
			deadlineSet: true, progressSet: true, progressValue: 40,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req UpdateDetailsRequest
			if err := json.Unmarshal([]byte(tt.payload), &req); err != nil {
				t.Fatalf("unmarshal: %v", err)
			}
			if req.Deadline.Set != tt.deadlineSet {
				t.Fatalf("Deadline.Set = %v, want %v", req.Deadline.Set, tt.deadlineSet)
			}
			if tt.deadlineSet && (req.Deadline.Value == nil) != tt.deadlineNil {
				t.Fatalf("Deadline.Value nil = %v, want nil=%v", req.Deadline.Value == nil, tt.deadlineNil)
			}
			if req.ProgressPct.Set != tt.progressSet {
				t.Fatalf("ProgressPct.Set = %v, want %v", req.ProgressPct.Set, tt.progressSet)
			}
			if tt.progressSet && tt.progressValue != 0 && (req.ProgressPct.Value == nil || *req.ProgressPct.Value != tt.progressValue) {
				t.Fatalf("ProgressPct.Value = %v, want %d", req.ProgressPct.Value, tt.progressValue)
			}
		})
	}
}
