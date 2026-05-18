package inventory

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func setupInventoryTestApp(mockRepo *MockRepo) *fiber.App {
	service := NewService(mockRepo, nil) // nil storage — not needed for GET endpoints
	handler := NewHandler(service, nil)   // nil authService — not needed for GET endpoints
	app := fiber.New()
	handler.RegisterRoutes(app)
	return app
}

func TestInventoryHandler_GetTotal(t *testing.T) {
	mockRepo := new(MockRepo)
	mockRepo.On("GetTotal", mock.Anything).Return(int64(42), nil)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products/total", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, float64(42), result["total"])
}

func TestInventoryHandler_GetLowStock(t *testing.T) {
	mockRepo := new(MockRepo)
	mockRepo.On("GetLowStock", mock.Anything).Return([]Product{
		{Title: "Low Stock Widget", StockLevel: 1, ReorderPoint: 3},
	}, nil)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products/stock/low", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var products []Product
	json.NewDecoder(resp.Body).Decode(&products)
	assert.Len(t, products, 1)
	assert.Equal(t, "Low Stock Widget", products[0].Title)
}

func TestInventoryHandler_GetAll_ValidPagination(t *testing.T) {
	mockRepo := new(MockRepo)
	mockRepo.On("GetAllFiltered", mock.Anything, mock.Anything).Return(
		[]Product{{Title: "Widget A"}}, int64(50), nil,
	)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products?page=2&limit=10", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result ProductListResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Len(t, result.Data, 1)
	assert.Equal(t, 2, result.Meta.Page)
	assert.Equal(t, 10, result.Meta.Limit)
	assert.Equal(t, int64(50), result.Meta.Total)
}

func TestInventoryHandler_GetAll_InvalidPage(t *testing.T) {
	mockRepo := new(MockRepo)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products?page=0", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "page must be")
}

func TestInventoryHandler_GetAll_InvalidLimit(t *testing.T) {
	mockRepo := new(MockRepo)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products?limit=101", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "limit must be")
}

func TestInventoryHandler_GetAll_InvalidSortBy(t *testing.T) {
	mockRepo := new(MockRepo)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products?sort_by=price", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "invalid sort_by")
}

func TestInventoryHandler_GetAll_MultipleInvalidParams(t *testing.T) {
	mockRepo := new(MockRepo)
	app := setupInventoryTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/products?page=-1&limit=200&sort_by=price", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	var result map[string][]map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.GreaterOrEqual(t, len(result["errors"]), 2, "should accumulate multiple errors")
}

func TestInventoryHandler_GetAll_StaticRoutesNotCaptured(t *testing.T) {
	// Proves /total and /stock/low are not captured by /:id
	mockRepo := new(MockRepo)
	mockRepo.On("GetTotal", mock.Anything).Return(int64(0), nil)
	app := setupInventoryTestApp(mockRepo)

	// "total" should hit GetTotal, not GetByID with id="total"
	req := httptest.NewRequest("GET", "/api/products/total", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	_, hasTotal := result["total"]
	assert.True(t, hasTotal, "should return total response, not a product")
}
