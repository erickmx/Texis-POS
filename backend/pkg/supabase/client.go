package supabase

import (
	"os"

	"github.com/supabase-community/supabase-go"
)

var client *supabase.Client

// Init initializes the shared Supabase client using environment variables.
func Init() error {
	url := os.Getenv("SUPABASE_URL")
	key := os.Getenv("SUPABASE_KEY")

	c, err := supabase.NewClient(url, key, nil)
	if err != nil {
		return err
	}

	client = c
	return nil
}

// GetClient returns the shared Supabase client.
func GetClient() *supabase.Client {
	return client
}
