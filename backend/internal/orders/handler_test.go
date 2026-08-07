package orders

import (
	"bytes"
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

func TestOrdersHandler_ListSpecialOrders_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("ListSpecial", mock.Anything).Return([]SpecialOrder{
		{
			ID: "uuid-1", Folio: 100, Status: "pending",
			SpecialRequestsDetails: []SpecialRequestDetail{{}},
		},
	}, nil)
	app := setupOrdersTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/orders/special", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result []SpecialOrderResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Len(t, result, 1)
	assert.Equal(t, 100, result[0].Folio)
}

func TestOrdersHandler_ListSpecialOrders_EmptyArray(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("ListSpecial", mock.Anything).Return([]SpecialOrder(nil), nil)
	app := setupOrdersTestApp(mockRepo)

	req := httptest.NewRequest("GET", "/api/orders/special", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Equal(t, "[]", string(body))
}

func TestOrdersHandler_UpdateOrderStatus_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("UpdateStatus", mock.Anything, "uuid-1", "in_progress").Return(nil)
	app := setupOrdersTestApp(mockRepo)

	body := bytes.NewBufferString(`{"status":"in_progress"}`)
	req := httptest.NewRequest("PATCH", "/api/orders/uuid-1/status", body)
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result UpdateStatusResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "uuid-1", result.ID)
	assert.Equal(t, "in_progress", result.Status)
}

func TestOrdersHandler_UpdateOrderStatus_InvalidStatus(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app := setupOrdersTestApp(mockRepo)

	body := bytes.NewBufferString(`{"status":"invalid"}`)
	req := httptest.NewRequest("PATCH", "/api/orders/uuid-1/status", body)
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	respBody, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(respBody), "invalid status")
}

func TestOrdersHandler_UpdateOrderStatus_EmptyStatus(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app := setupOrdersTestApp(mockRepo)

	body := bytes.NewBufferString(`{"status":""}`)
	req := httptest.NewRequest("PATCH", "/api/orders/uuid-1/status", body)
	req.Header.Set("Content-Type", "application/json")
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
}
