package orders

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/erickmx/texis-pos/internal/storage"
	"github.com/gofiber/fiber/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// mockStorageProvider is a configurable storage.ImageStorageProvider double.
type mockStorageProvider struct {
	uploadURL string
	uploadErr error
	deleteErr error
	deleted   []string
}

func (m *mockStorageProvider) Upload(ctx context.Context, bucket, filename string, reader io.Reader) (string, error) {
	if m.uploadErr != nil {
		return "", m.uploadErr
	}
	return m.uploadURL, nil
}

func (m *mockStorageProvider) Exists(ctx context.Context, bucket, filename string) (bool, error) {
	return true, nil
}

func (m *mockStorageProvider) Delete(ctx context.Context, bucket, filename string) error {
	m.deleted = append(m.deleted, filename)
	return m.deleteErr
}

func (m *mockStorageProvider) GetPublicUrl(bucket, filename string) string {
	return m.uploadURL
}

func newMockStorageProvider() *mockStorageProvider {
	return &mockStorageProvider{uploadURL: "https://proj.supabase.co/storage/v1/object/public/inventory-images/test.jpg"}
}

// setupOrdersTestApp builds the orders app with the REAL auth middleware
// (decision 12: no mocked middleware) and returns a valid seller token.
func setupOrdersTestApp(mockRepo *MockOrderRepo, mockStorage *mockStorageProvider) (*fiber.App, string) {
	service := NewService(mockRepo)
	authSvc := auth.NewService("test-secret", "admin", "adminpass", "seller", "sellerpass")
	storageSvc := storage.NewService(mockStorage)
	handler := NewHandler(service, authSvc, storageSvc)
	app := fiber.New()
	handler.RegisterRoutes(app)

	token, err := authSvc.Login(context.Background(), "seller", "sellerpass", "10.9.9.9", "")
	if err != nil {
		panic("test token generation failed: " + err.Error())
	}
	return app, token
}

func authedRequest(method, url, token string, body io.Reader) *http.Request {
	req := httptest.NewRequest(method, url, body)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Authorization", "Bearer "+token)
	return req
}

func multipartRequest(t *testing.T, url, token, field, filename string, content []byte) *http.Request {
	t.Helper()
	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile(field, filename)
	assert.NoError(t, err)
	_, err = fw.Write(content)
	assert.NoError(t, err)
	assert.NoError(t, w.Close())
	req := httptest.NewRequest("POST", url, &buf)
	req.Header.Set("Content-Type", w.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)
	return req
}

// --- Auth gate ---

func TestOrdersHandler_AuthRequired(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, _ := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	for _, target := range []struct{ method, url string }{
		{"GET", "/api/orders/special"},
		{"POST", "/api/orders/special"},
		{"PATCH", "/api/orders/uuid-1/status"},
		{"PATCH", "/api/orders/uuid-1/details"},
		{"POST", "/api/orders/uuid-1/attachments"},
		{"DELETE", "/api/orders/uuid-1/attachments"},
	} {
		req := httptest.NewRequest(target.method, target.url, nil)
		resp, _ := app.Test(req)
		assert.Equal(t, 401, resp.StatusCode, target.method+" "+target.url)
	}
}

func TestOrdersHandler_SellerTokenAllowed(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("ListSpecial", mock.Anything).Return([]SpecialOrder(nil), nil)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders/special", token, nil)
	resp, _ := app.Test(req)
	assert.Equal(t, 200, resp.StatusCode)
}

// --- List orders ---

func TestOrdersHandler_ListOrders_ValidRequest(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("List", mock.Anything, mock.Anything).Return(
		[]Order{{Status: "pending", Folio: 1001}}, int64(5), nil,
	)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders?page=1&limit=20", token, nil)
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
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders?status=completed", token, nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "invalid status")
	assert.Contains(t, string(body), "completed")
}

func TestOrdersHandler_ListOrders_InvalidPage(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders?page=0", token, nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(body), "page must be")
}

func TestOrdersHandler_ListOrders_MultipleInvalidParams(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders?page=-1&limit=200&sort_by=customer", token, nil)
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
			SpecialRequestsDetails: SpecialRequestDetails{{}},
		},
	}, nil)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders/special", token, nil)
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
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("GET", "/api/orders/special", token, nil)
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	body, _ := io.ReadAll(resp.Body)
	assert.Equal(t, "[]", string(body))
}

// --- Status transitions ---

func TestOrdersHandler_UpdateOrderStatus_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("UpdateStatus", mock.Anything, "uuid-1", "in_progress").Return(nil)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/status", token, bytes.NewBufferString(`{"status":"in_progress"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result UpdateStatusResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "uuid-1", result.ID)
	assert.Equal(t, "in_progress", result.Status)
}

func TestOrdersHandler_UpdateOrderStatus_InvalidStatus(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/status", token, bytes.NewBufferString(`{"status":"invalid"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	respBody, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(respBody), "invalid status")
}

func TestOrdersHandler_UpdateOrderStatus_EmptyStatus(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/status", token, bytes.NewBufferString(`{"status":""}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
}

func TestOrdersHandler_UpdateOrderStatus_UnknownID_Returns404(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("UpdateStatus", mock.Anything, "00000000-0000-0000-0000-000000000000", "in_progress").
		Return(errors.New("order not found"))
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/00000000-0000-0000-0000-000000000000/status", token, bytes.NewBufferString(`{"status":"in_progress"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 404, resp.StatusCode)
	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]string
	json.Unmarshal(respBody, &result)
	assert.Equal(t, "order not found", result["error"])
}

// --- Details PATCH (slice 2a regression) ---

func TestOrdersHandler_UpdateOrderDetails_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("UpdateDetails", mock.Anything, "uuid-1", mock.Anything, 1722.0).Return(nil)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/details", token,
		bytes.NewBufferString(`{"title":"Maqueta","gasto_terceros":1200,"service_fee":450,"progress_pct":40,"deadline":"2026-12-01T12:00:00Z"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	var result UpdateDetailsResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "uuid-1", result.ID)
	assert.Equal(t, 1722.0, result.TotalAmount)
}

func TestOrdersHandler_UpdateOrderDetails_ProgressOutOfRange(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/details", token, bytes.NewBufferString(`{"progress_pct":101}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	respBody, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(respBody), "progress_pct")
}

func TestOrdersHandler_UpdateOrderDetails_NegativeFiscal(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/details", token, bytes.NewBufferString(`{"gasto_terceros":-5,"service_fee":100}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
	respBody, _ := io.ReadAll(resp.Body)
	assert.Contains(t, string(respBody), "gasto_terceros")
}

func TestOrdersHandler_UpdateOrderDetails_UnknownID_Returns404(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("UpdateDetails", mock.Anything, "missing", mock.Anything, mock.Anything).
		Return(errors.New("order not found"))
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/missing/details", token, bytes.NewBufferString(`{"title":"x"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 404, resp.StatusCode)
	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]string
	json.Unmarshal(respBody, &result)
	assert.Equal(t, "order not found", result["error"])
}

func TestOrdersHandler_UpdateOrderDetails_ExplicitNullsPersist(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockRepo.On("UpdateDetails", mock.Anything, "uuid-1", mock.Anything, mock.Anything).
		Return(nil).
		Run(func(args mock.Arguments) {
			req := args.Get(2).(UpdateDetailsRequest)
			assert.True(t, req.Deadline.Set, "deadline must be marked set")
			assert.Nil(t, req.Deadline.Value, "explicit null deadline must be nil")
			assert.True(t, req.ProgressPct.Set, "progress_pct must be marked set")
			assert.Nil(t, req.ProgressPct.Value, "explicit null progress_pct must be nil")
		})
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("PATCH", "/api/orders/uuid-1/details", token, bytes.NewBufferString(`{"deadline":null,"progress_pct":null}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	mockRepo.AssertExpectations(t)
}

// --- Create special request ---

func TestOrdersHandler_CreateSpecial_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	// total matcher enforces the fiscal derivation at the boundary: 1200+450+72
	mockRepo.On("CreateSpecial", mock.Anything, mock.Anything, 1722.0).Return("new-id", 42, nil)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	body := `{"customer_name":"Juan Pérez","customer_wa":"+525551234567","title":"Maqueta","gasto_terceros":1200,"service_fee":450,"attachments":["https://proj.supabase.co/storage/v1/object/public/inventory-images/a.png"]}`
	req := authedRequest("POST", "/api/orders/special", token, bytes.NewBufferString(body))
	resp, _ := app.Test(req)

	assert.Equal(t, 201, resp.StatusCode)
	var result CreateSpecialResponse
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, "new-id", result.ID)
	assert.Equal(t, 42, result.Folio)
}

func TestOrdersHandler_CreateSpecial_ValidationErrors(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		wantField string
	}{
		{name: "missing customer_name", body: `{"customer_name":"  ","service_fee":100}`, wantField: "customer_name"},
		{name: "progress out of range", body: `{"customer_name":"J","progress_pct":101}`, wantField: "progress_pct"},
		{name: "negative fiscal", body: `{"customer_name":"J","gasto_terceros":-5}`, wantField: "gasto_terceros"},
		{name: "bad attachment url", body: `{"customer_name":"J","attachments":["http://evil.example.com/x.png"]}`, wantField: "attachments"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(MockOrderRepo)
			app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

			req := authedRequest("POST", "/api/orders/special", token, bytes.NewBufferString(tt.body))
			resp, _ := app.Test(req)

			assert.Equal(t, 400, resp.StatusCode)
			respBody, _ := io.ReadAll(resp.Body)
			assert.Contains(t, string(respBody), tt.wantField)
			mockRepo.AssertNotCalled(t, "CreateSpecial", mock.Anything, mock.Anything, mock.Anything)
		})
	}
}

// --- Attachment upload ---

func TestOrdersHandler_UploadAttachment_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockStorage := newMockStorageProvider()
	mockRepo.On("AppendAttachment", mock.Anything, "uuid-1", mockStorage.uploadURL).Return(nil)
	app, token := setupOrdersTestApp(mockRepo, mockStorage)

	req := multipartRequest(t, "/api/orders/uuid-1/attachments", token, "file", "photo.jpg", []byte("img-bytes"))
	resp, _ := app.Test(req)

	assert.Equal(t, 201, resp.StatusCode)
	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(t, mockStorage.uploadURL, result["url"])
	mockRepo.AssertExpectations(t)
}

func TestOrdersHandler_UploadAttachment_Rejections(t *testing.T) {
	t.Run("too large maps to 413", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		mockStorage := newMockStorageProvider()
		mockStorage.uploadErr = storage.ErrFileTooLarge
		app, token := setupOrdersTestApp(mockRepo, mockStorage)

		req := multipartRequest(t, "/api/orders/uuid-1/attachments", token, "file", "big.jpg", []byte("x"))
		resp, _ := app.Test(req)
		assert.Equal(t, 413, resp.StatusCode)
	})

	t.Run("invalid format maps to 400", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		mockStorage := newMockStorageProvider()
		mockStorage.uploadErr = storage.ErrInvalidFormat
		app, token := setupOrdersTestApp(mockRepo, mockStorage)

		req := multipartRequest(t, "/api/orders/uuid-1/attachments", token, "file", "doc.txt", []byte("x"))
		resp, _ := app.Test(req)
		assert.Equal(t, 400, resp.StatusCode)
	})

	t.Run("unknown order returns 404 and cleans the orphan object", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		mockStorage := newMockStorageProvider()
		mockRepo.On("AppendAttachment", mock.Anything, "missing", mockStorage.uploadURL).
			Return(errors.New("order not found"))
		app, token := setupOrdersTestApp(mockRepo, mockStorage)

		req := multipartRequest(t, "/api/orders/missing/attachments", token, "file", "photo.jpg", []byte("x"))
		resp, _ := app.Test(req)
		assert.Equal(t, 404, resp.StatusCode)
		assert.Equal(t, []string{"test.jpg"}, mockStorage.deleted, "orphan bucket object must be deleted best-effort")
	})
}

// --- Attachment delete ---

func TestOrdersHandler_DeleteAttachment_Success(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockStorage := newMockStorageProvider()
	url := "https://proj.supabase.co/storage/v1/object/public/inventory-images/obj-1.png"
	mockRepo.On("RemoveAttachment", mock.Anything, "uuid-1", url).Return(nil)
	app, token := setupOrdersTestApp(mockRepo, mockStorage)

	req := authedRequest("DELETE", "/api/orders/uuid-1/attachments", token,
		bytes.NewBufferString(`{"url":"`+url+`"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode)
	assert.Equal(t, []string{"obj-1.png"}, mockStorage.deleted, "bucket object must be hard-deleted")
	mockRepo.AssertExpectations(t)
}

func TestOrdersHandler_DeleteAttachment_StorageFailureStillUnlinks(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockStorage := newMockStorageProvider()
	mockStorage.deleteErr = errors.New("bucket unavailable")
	url := "https://proj.supabase.co/storage/v1/object/public/inventory-images/obj-2.png"
	mockRepo.On("RemoveAttachment", mock.Anything, "uuid-1", url).Return(nil)
	app, token := setupOrdersTestApp(mockRepo, mockStorage)

	req := authedRequest("DELETE", "/api/orders/uuid-1/attachments", token,
		bytes.NewBufferString(`{"url":"`+url+`"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 200, resp.StatusCode, "idempotent: unlink succeeds even when the bucket delete fails")
}

func TestOrdersHandler_DeleteAttachment_UnknownOrder(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	mockStorage := newMockStorageProvider()
	mockRepo.On("RemoveAttachment", mock.Anything, "missing", mock.Anything).Return(errors.New("order not found"))
	app, token := setupOrdersTestApp(mockRepo, mockStorage)

	req := authedRequest("DELETE", "/api/orders/missing/attachments", token,
		bytes.NewBufferString(`{"url":"https://proj.supabase.co/storage/v1/object/public/inventory-images/x.png"}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 404, resp.StatusCode)
	assert.Empty(t, mockStorage.deleted, "no bucket delete for an unknown order")
}

func TestOrdersHandler_DeleteAttachment_MissingURL(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	app, token := setupOrdersTestApp(mockRepo, newMockStorageProvider())

	req := authedRequest("DELETE", "/api/orders/uuid-1/attachments", token, bytes.NewBufferString(`{}`))
	resp, _ := app.Test(req)

	assert.Equal(t, 400, resp.StatusCode)
}
