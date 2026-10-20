package storage

import (
	"bytes"
	"context"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func setupStorageTestApp(t *testing.T, mockProvider *MockProvider) (*fiber.App, string, string) {
	t.Helper()
	service := NewService(mockProvider)
	authSvc := auth.NewService("test-secret", "admin", "adminpass", "seller", "sellerpass")
	handler := NewHandler(service, authSvc)
	app := fiber.New()
	handler.RegisterRoutes(app)

	sellerToken, err := authSvc.Login(context.Background(), "seller", "sellerpass", "10.8.8.8", "")
	assert.NoError(t, err)
	adminToken, err := authSvc.Login(context.Background(), "admin", "adminpass", "10.8.8.7", "")
	assert.NoError(t, err)
	return app, sellerToken, adminToken
}

func storageUploadRequest(t *testing.T, token, field, filename string) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile(field, filename)
	assert.NoError(t, err)
	_, err = fw.Write([]byte("img-bytes"))
	assert.NoError(t, err)
	assert.NoError(t, w.Close())

	req := httptest.NewRequest("POST", "/api/storage/upload", &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	return req
}

func TestStorageHandler_Upload(t *testing.T) {
	publicURL := "https://proj.supabase.co/storage/v1/object/public/inventory-images/x.jpg"

	t.Run("seller uploads jpg via field name 'file' (regression: was 'image')", func(t *testing.T) {
		mockProvider := new(MockProvider)
		mockProvider.On("Upload", mock.Anything, InventoryBucket, mock.AnythingOfType("string"), mock.Anything).Return(publicURL, nil)
		app, sellerToken, _ := setupStorageTestApp(t, mockProvider)

		resp, _ := app.Test(storageUploadRequest(t, sellerToken, "file", "photo.jpg"))
		assert.Equal(t, 201, resp.StatusCode)
		mockProvider.AssertExpectations(t)
	})

	t.Run("png accepted end-to-end", func(t *testing.T) {
		mockProvider := new(MockProvider)
		mockProvider.On("Upload", mock.Anything, InventoryBucket, mock.AnythingOfType("string"), mock.Anything).Return(publicURL, nil)
		app, _, adminToken := setupStorageTestApp(t, mockProvider)

		resp, _ := app.Test(storageUploadRequest(t, adminToken, "file", "photo.png"))
		assert.Equal(t, 201, resp.StatusCode)
	})

	t.Run("unauthenticated upload returns 401", func(t *testing.T) {
		mockProvider := new(MockProvider)
		app, _, _ := setupStorageTestApp(t, mockProvider)

		resp, _ := app.Test(storageUploadRequest(t, "", "file", "photo.jpg"))
		assert.Equal(t, 401, resp.StatusCode)
	})

	t.Run("wrong field name returns 400", func(t *testing.T) {
		mockProvider := new(MockProvider)
		app, sellerToken, _ := setupStorageTestApp(t, mockProvider)

		resp, _ := app.Test(storageUploadRequest(t, sellerToken, "image", "photo.jpg"))
		assert.Equal(t, 400, resp.StatusCode)
	})
}
