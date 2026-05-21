package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
)

func TestAuthHandler(t *testing.T) {
	jwtSecret := "test-secret"
	adminUser := "admin"
	adminPass := "admin123"
	sellerUser := "seller"
	sellerPass := "seller123"

	svc := NewService(jwtSecret, adminUser, adminPass, sellerUser, sellerPass)
	handler := NewHandler(svc)

	app := fiber.New()
	app.Post("/login", handler.Login)
	app.Post("/refresh", handler.Refresh)

	t.Run("POST /login - Success Admin", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: adminUser,
			Password: adminPass,
			Website:  "",
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)

		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		assert.NotEmpty(t, result["token"])

		claims, _ := svc.VerifyToken(result["token"])
		assert.Equal(t, "admin", claims.Role)
	})

	t.Run("POST /login - Success Seller", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: sellerUser,
			Password: sellerPass,
			Website:  "",
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)

		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		assert.NotEmpty(t, result["token"])

		claims, _ := svc.VerifyToken(result["token"])
		assert.Equal(t, "seller", claims.Role)
	})

	t.Run("POST /login - Failure Unauthorized", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: "wrong-user-test-unauth",
			Password: "wrong",
			Website:  "",
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode)

		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		assert.Equal(t, "invalid credentials", result["error"])
	})

	t.Run("POST /login - Honeypot Triggered", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: adminUser,
			Password: adminPass,
			Website:  "bot",
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 400, resp.StatusCode)

		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		assert.Equal(t, "bad request", result["error"])
	})

	t.Run("POST /login - IP Lockout", func(t *testing.T) {
		// Create a separate service instance to isolate IP cache
		tempSvc := NewService(jwtSecret, adminUser, adminPass, sellerUser, sellerPass)
		tempHandler := NewHandler(tempSvc)
		tempApp := fiber.New()
		tempApp.Post("/login", tempHandler.Login)

		body, _ := json.Marshal(LoginDTO{
			Username: adminUser,
			Password: "wrong-password",
			Website:  "",
		})

		// Make 5 failing requests
		for i := 0; i < 5; i++ {
			req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("X-Forwarded-For", "192.168.1.99")
			resp, _ := tempApp.Test(req)
			assert.Equal(t, 401, resp.StatusCode)
		}

		// 6th request should fail with 429
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Forwarded-For", "192.168.1.99")
		resp, _ := tempApp.Test(req)
		assert.Equal(t, 429, resp.StatusCode)

		var result map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&result)
		assert.Contains(t, result["error"], "Too many failed attempts")
		assert.Greater(t, result["remainingSeconds"], float64(0))
	})

	t.Run("POST /refresh - Success", func(t *testing.T) {
		// Log in first to get token
		body, _ := json.Marshal(LoginDTO{
			Username: adminUser,
			Password: adminPass,
			Website:  "",
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		resp, _ := app.Test(req)
		var loginResult map[string]string
		json.NewDecoder(resp.Body).Decode(&loginResult)
		token := loginResult["token"]

		// Now refresh it
		reqRefresh := httptest.NewRequest("POST", "/refresh", nil)
		reqRefresh.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
		respRefresh, _ := app.Test(reqRefresh)
		assert.Equal(t, 200, respRefresh.StatusCode)

		var refreshResult map[string]string
		json.NewDecoder(respRefresh.Body).Decode(&refreshResult)
		assert.NotEmpty(t, refreshResult["token"])
	})

	t.Run("POST /refresh - Failure", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/refresh", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode)
	})
}
