package orders

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func setupOrdersTestApp(mockRepo *MockOrderRepo) *fiber.App {
	service := NewService(mockRepo)
	handler := NewHandler(service)
	app := fiber.New()
	handler.RegisterRoutes(app)
	return app
}

func TestOrdersHandler_ListOrders_ValidRequest(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("List", mock.Anything, mock.Anything).Return(
		[]Order{{Status: "pending", Folio: 1001}}, int64(5), nil,
	)
	app := setupOrdersTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/orders?page=1&limit=20", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result OrderListResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Len(t, result.Data, 1)
	assert.Equal(t, "pending", result.Data[0].Status)
	assert.Equal(t, 1001, result.Data[0].Folio)
	assert.Equal(t, 1, result.Meta.Page)
	assert.Equal(t, 20, result.Meta.Limit)
	assert.Equal(t, int64(5), result.Meta.Total)
}

func TestOrdersHandler_ListOrders_InvalidStatus(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app := setupOrdersTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/orders?status=completed", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "invalid status")
	assert.Contains(t, string(body), "completed")
}

func TestOrdersHandler_ListOrders_InvalidPage(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app := setupOrdersTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/orders?page=0", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "page must be")
}

func TestOrdersHandler_ListOrders_MultipleInvalidParams(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app := setupOrdersTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/orders?page=-1&limit=200&sort_by=customer", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	var result map[string][]map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.GreaterOrEqual(t, len(result["errors"]), 2, "should accumulate multiple errors")
}
