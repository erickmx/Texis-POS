package inventory

import (
	"context"
	"fmt"
	"net/http/httptest"
	"testing"

	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
)

func TestInventoryRBAC(t *testing.T) {
	// Setup Auth
	jwtSecret := "test-secret"
	authSvc := auth.NewService(jwtSecret, "admin", "admin123", "seller", "seller123")
	adminToken, _ := authSvc.Login(context.Background(), "admin", "admin123")
	sellerToken, _ := authSvc.Login(context.Background(), "seller", "seller123")

	// Setup Mocks
	mockRepo := new(MockRepo)
	mockStorage := new(MockStorage)
	service := NewService(mockRepo, mockStorage)
	handler := NewHandler(service, authSvc)

	app := fiber.New()
	handler.RegisterRoutes(app)

	t.Run("GET /api/products/ - Public Access", func(t *testing.T) {
		mockRepo.On("GetAll", context.Background()).Return([]Product{}, nil)
		
		req := httptest.NewRequest("GET", "/api/products/", nil)
		resp, _ := app.Test(req)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("POST /api/products/ - Admin Access Success", func(t *testing.T) {
		// Just testing the middleware, so we don't care about the handler body for now
		// but Fiber might try to bind body
		req := httptest.NewRequest("POST", "/api/products/", nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", adminToken))
		resp, _ := app.Test(req)
		// It will likely be 400 Bad Request if it tries to bind empty body, 
		// but NOT 401 or 403.
		assert.NotEqual(t, 401, resp.StatusCode)
		assert.NotEqual(t, 403, resp.StatusCode)
	})

	t.Run("POST /api/products/ - Seller Access Forbidden", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/products/", nil)
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", sellerToken))
		resp, _ := app.Test(req)
		assert.Equal(t, 403, resp.StatusCode)
	})

	t.Run("POST /api/products/ - No Token Unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/products/", nil)
		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode)
	})
}
