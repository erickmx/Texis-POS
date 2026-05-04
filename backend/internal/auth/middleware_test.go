package auth

import (
	"context"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
)

func TestMiddleware(t *testing.T) {
	jwtSecret := "test-secret"
	adminUser := "admin"
	adminPass := "admin123"
	sellerUser := "seller"
	sellerPass := "seller123"

	svc := NewService(jwtSecret, adminUser, adminPass, sellerUser, sellerPass)
	
	adminToken, _ := svc.Login(context.Background(), adminUser, adminPass)
	sellerToken, _ := svc.Login(context.Background(), sellerUser, sellerPass)

	app := fiber.New()
	
	// Protected routes
	app.Get("/admin", IsAdmin(svc), func(c fiber.Ctx) error {
		return c.SendString("admin ok")
	})
	app.Get("/seller", IsSeller(svc), func(c fiber.Ctx) error {
		return c.SendString("seller ok")
	})
	app.Get("/auth", IsAuthenticated(svc), func(c fiber.Ctx) error {
		return c.SendString("auth ok")
	})

	t.Run("IsAdmin - Success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/admin", nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", adminToken))
		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("IsAdmin - Forbidden for Seller", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/admin", nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", sellerToken))
		resp, _ := app.Test(req)
		assert.Equal(t, 403, resp.StatusCode)
	})

	t.Run("IsSeller - Success", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/seller", nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", sellerToken))
		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("IsAuthenticated - Success for Admin", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/auth", nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", adminToken))
		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("IsAuthenticated - Failure Missing Token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/auth", nil)
		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode)
	})

	t.Run("IsAuthenticated - Failure Invalid Token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/auth", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode)
	})
}
