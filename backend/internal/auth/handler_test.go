package auth

import (
	"bytes"
	"encoding/json"
	"io"
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

	t.Run("POST /login - Success Admin", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: adminUser,
			Password: adminPass,
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)

		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		assert.NotEmpty(t, result["token"])

		// Verify role
		claims, _ := svc.VerifyToken(result["token"])
		assert.Equal(t, "admin", claims.Role)
	})

	t.Run("POST /login - Success Seller", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: sellerUser,
			Password: sellerPass,
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)

		var result map[string]string
		json.NewDecoder(resp.Body).Decode(&result)
		assert.NotEmpty(t, result["token"])

		// Verify role
		claims, _ := svc.VerifyToken(result["token"])
		assert.Equal(t, "seller", claims.Role)
	})

	t.Run("POST /login - Failure Unauthorized", func(t *testing.T) {
		body, _ := json.Marshal(LoginDTO{
			Username: "wrong",
			Password: "wrong",
		})
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode)

		// Check that body is empty or doesn't have hints (per spec)
		bodyBytes, _ := io.ReadAll(resp.Body)
		assert.True(t, len(bodyBytes) == 0 || string(bodyBytes) == "Unauthorized")
	})

	t.Run("POST /login - Failure Bad Request", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/login", bytes.NewReader([]byte("not-json")))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		assert.Equal(t, 400, resp.StatusCode)
	})
}
