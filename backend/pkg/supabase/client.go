package supabase

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/supabase-community/supabase-go"
)

var client *supabase.Client

// Init initializes the shared Supabase client using environment variables.
func Init() error {
	// Load .env file if it exists
	_ = godotenv.Load()

	url := os.Getenv("SUPABASE_URL")
	url = strings.TrimSuffix(url, "/")
	url = strings.TrimSuffix(url, "/rest/v1")
	key := os.Getenv("SUPABASE_SERVICE_ROLE")

	if url == "" || key == "" {
		log.Println("WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE is missing")
	} else {
		log.Printf("Initializing Supabase with URL: %s (using service role)", url)
	}

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
