package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/helmet"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/stretchr/testify/assert"
)

func setupTestApp() *fiber.App {
	app := fiber.New()

	// Register the same middlewares as main.go
	app.Use(helmet.New())

	whitelist := os.Getenv("CORS_WHITELIST")
	if whitelist == "" {
		whitelist = "http://localhost:3000"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Split(whitelist, ","),
	}))

	app.Use(limiter.New(limiter.Config{
		Max:        2, // Low for testing
		Expiration: 1 * time.Second,
	}))

	app.Get("/test", func(c fiber.Ctx) error {
		return c.SendString("ok")
	})

	return app
}

func TestHelmetHeaders(t *testing.T) {
	app := setupTestApp()

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)

	assert.Nil(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Check for standard Helmet headers
	assert.Equal(t, "nosniff", resp.Header.Get("X-Content-Type-Options"))
	assert.Equal(t, "SAMEORIGIN", resp.Header.Get("X-Frame-Options"))
	assert.Equal(t, "noopen", resp.Header.Get("X-Download-Options"))
	assert.Equal(t, "0", resp.Header.Get("X-XSS-Protection"))
}

func TestCORSWhitelist(t *testing.T) {
	os.Setenv("CORS_WHITELIST", "http://allowed.com,http://another.com")
	defer os.Unsetenv("CORS_WHITELIST")

	app := setupTestApp()

	t.Run("Allowed Origin", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://allowed.com")
		resp, err := app.Test(req)

		assert.Nil(t, err)
		assert.Equal(t, "http://allowed.com", resp.Header.Get("Access-Control-Allow-Origin"))
	})

	t.Run("Disallowed Origin", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("Origin", "http://malicious.com")
		resp, err := app.Test(req)

		assert.Nil(t, err)
		assert.Empty(t, resp.Header.Get("Access-Control-Allow-Origin"))
	})
}

func TestRateLimiter(t *testing.T) {
	app := setupTestApp()

	// 1st request
	req1 := httptest.NewRequest("GET", "/test", nil)
	resp1, _ := app.Test(req1)
	assert.Equal(t, http.StatusOK, resp1.StatusCode)

	// 2nd request
	req2 := httptest.NewRequest("GET", "/test", nil)
	resp2, _ := app.Test(req2)
	assert.Equal(t, http.StatusOK, resp2.StatusCode)

	// 3rd request (should be limited)
	req3 := httptest.NewRequest("GET", "/test", nil)
	resp3, _ := app.Test(req3)
	assert.Equal(t, http.StatusTooManyRequests, resp3.StatusCode)
}
