package db

import (
	"os"
	"testing"
)

func skipIfNoSupabase(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}
	if os.Getenv("SUPABASE_URL") == "" || os.Getenv("SUPABASE_SERVICE_ROLE") == "" {
		t.Skip("SUPABASE_URL or SUPABASE_SERVICE_ROLE not set")
	}
}
