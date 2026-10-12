package orders

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/erickmx/texis-pos/internal/orders/validation"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockOrderRepo struct {
	mock.Mock
}

func (m *MockOrderRepo) List(ctx context.Context, filter validation.OrderFilter) ([]Order, int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]Order), args.Get(1).(int64), args.Error(2)
}

func (m *MockOrderRepo) ListSpecial(ctx context.Context) ([]SpecialOrder, error) {
	args := m.Called(ctx)
	return args.Get(0).([]SpecialOrder), args.Error(1)
}

func (m *MockOrderRepo) UpdateStatus(ctx context.Context, id string, status string) error {
	args := m.Called(ctx, id, status)
	return args.Error(0)
}

func (m *MockOrderRepo) UpdateDetails(ctx context.Context, id string, req UpdateDetailsRequest, totalAmount float64) error {
	args := m.Called(ctx, id, req, totalAmount)
	return args.Error(0)
}

func (m *MockOrderRepo) CreateSpecial(ctx context.Context, req CreateSpecialRequest, totalAmount float64) (string, int, error) {
	args := m.Called(ctx, req, totalAmount)
	return args.String(0), args.Int(1), args.Error(2)
}

func (m *MockOrderRepo) AppendAttachment(ctx context.Context, id string, url string) error {
	args := m.Called(ctx, id, url)
	return args.Error(0)
}

func (m *MockOrderRepo) RemoveAttachment(ctx context.Context, id string, url string) error {
	args := m.Called(ctx, id, url)
	return args.Error(0)
}

func TestOrderService_ListOrders(t *testing.T) {
	ctx := context.Background()
	filter := validation.OrderFilter{Page: 1, Limit: 20, SortBy: "created_at", SortOrder: "desc"}

	t.Run("Success with meta", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		mockRepo.On("List", ctx, filter).Return([]Order{{Status: "pending"}}, int64(5), nil)
		resp, err := service.ListOrders(ctx, filter)
		assert.NoError(t, err)
		assert.Len(t, resp.Data, 1)
		assert.Equal(t, int64(5), resp.Meta.Total)
		assert.Equal(t, 1, resp.Meta.TotalPages)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		mockRepo.On("List", ctx, filter).Return([]Order(nil), int64(0), errors.New("db error"))
		resp, err := service.ListOrders(ctx, filter)
		assert.Error(t, err)
		assert.Empty(t, resp.Data)
	})
}

func TestOrderService_ListSpecialOrders(t *testing.T) {
	ctx := context.Background()

	t.Run("returns flat DTOs with correct mapping", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		title := "Colonial House"
		desc := "Build a model"
		customer := "Juan"
		mockRepo.On("ListSpecial", ctx).Return([]SpecialOrder{
			{
				ID: "uuid-1", Folio: 100, CustomerName: &customer, Status: "pending",
				SpecialRequestsDetails: SpecialRequestDetails{
					{Title: &title, TaskDescription: &desc, Attachments: []string{"a.pdf", "b.pdf"}},
				},
			},
		}, nil)

		result, err := service.ListSpecialOrders(ctx)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, 100, result[0].Folio)
		assert.Equal(t, "uuid-1", result[0].OrderID)
		assert.Equal(t, "Juan", result[0].CustomerName)
		assert.Equal(t, "Colonial House", result[0].Title)
		assert.Equal(t, 2, result[0].AttachmentCount)
	})

	t.Run("excludes DONE orders older than 30 days", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		oldTime := time.Now().UTC().AddDate(0, 0, -45)
		recentTime := time.Now().UTC().AddDate(0, 0, -5)
		mockRepo.On("ListSpecial", ctx).Return([]SpecialOrder{
			{
				ID: "old", Folio: 1, Status: "done",
				SpecialRequestsDetails: SpecialRequestDetails{{CompletedAt: &oldTime}},
			},
			{
				ID: "recent", Folio: 2, Status: "done",
				SpecialRequestsDetails: SpecialRequestDetails{{CompletedAt: &recentTime}},
			},
		}, nil)

		result, err := service.ListSpecialOrders(ctx)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "recent", result[0].OrderID)
	})

	t.Run("sorts by deadline ASC nulls last within status group", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		d1 := time.Now().UTC().Add(48 * time.Hour)
		d2 := time.Now().UTC().Add(24 * time.Hour)
		mockRepo.On("ListSpecial", ctx).Return([]SpecialOrder{
			{ID: "a", Folio: 1, Status: "pending", SpecialRequestsDetails: SpecialRequestDetails{{Deadline: &d1}}},
			{ID: "b", Folio: 2, Status: "pending", SpecialRequestsDetails: SpecialRequestDetails{{Deadline: &d2}}},
			{ID: "c", Folio: 3, Status: "pending", SpecialRequestsDetails: SpecialRequestDetails{{Deadline: nil}}},
		}, nil)

		result, err := service.ListSpecialOrders(ctx)
		assert.NoError(t, err)
		assert.Len(t, result, 3)
		assert.Equal(t, "b", result[0].OrderID) // earliest deadline first
		assert.Equal(t, "a", result[1].OrderID)
		assert.Equal(t, "c", result[2].OrderID) // null deadline last
	})

	t.Run("handles empty detail array gracefully", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		mockRepo.On("ListSpecial", ctx).Return([]SpecialOrder{
			{ID: "x", Folio: 5, Status: "pending", SpecialRequestsDetails: SpecialRequestDetails{}},
		}, nil)

		result, err := service.ListSpecialOrders(ctx)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "", result[0].Title)
		assert.Equal(t, 0, result[0].AttachmentCount)
	})
}

func TestOrderService_UpdateOrderStatus(t *testing.T) {
	ctx := context.Background()

	t.Run("valid status persists", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		mockRepo.On("UpdateStatus", ctx, "uuid-1", "in_progress").Return(nil)

		err := service.UpdateOrderStatus(ctx, "uuid-1", "in_progress")
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid status returns error", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)

		err := service.UpdateOrderStatus(ctx, "uuid-1", "invalid_status")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid status")
	})

	t.Run("empty status returns error", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)

		err := service.UpdateOrderStatus(ctx, "uuid-1", "")
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "required")
	})
}

func TestOrderService_UpdateOrderDetails(t *testing.T) {
	ctx := context.Background()

	gasto := 1200.0
	serviceFee := 450.0

	t.Run("valid payload persists derived total 1722", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		req := UpdateDetailsRequest{GastoTerceros: &gasto, ServiceFee: &serviceFee}
		mockRepo.On("UpdateDetails", ctx, "uuid-1", req, 1722.0).Return(nil)

		total, err := service.UpdateOrderDetails(ctx, "uuid-1", req)
		assert.NoError(t, err)
		assert.Equal(t, 1722.0, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("progress_pct 101 returns validation error without touching repo", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		oob := 101
		req := UpdateDetailsRequest{ProgressPct: NullableInt{Set: true, Value: &oob}}

		_, err := service.UpdateOrderDetails(ctx, "uuid-1", req)
		var verrs ValidationErrors
		assert.True(t, errors.As(err, &verrs))
		assert.Equal(t, "progress_pct", verrs[0].Field)
	})

	t.Run("negative fiscal value returns validation error", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		neg := -1.0
		req := UpdateDetailsRequest{GastoTerceros: &neg}

		_, err := service.UpdateOrderDetails(ctx, "uuid-1", req)
		var verrs ValidationErrors
		assert.True(t, errors.As(err, &verrs))
		assert.Equal(t, "gasto_terceros", verrs[0].Field)
	})

	t.Run("absent fiscal fields derive total 0 and skip orders update", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		req := UpdateDetailsRequest{Title: ptrString("Maqueta")}
		mockRepo.On("UpdateDetails", ctx, "uuid-1", req, 0.0).Return(nil)

		total, err := service.UpdateOrderDetails(ctx, "uuid-1", req)
		assert.NoError(t, err)
		assert.Equal(t, 0.0, total)
		mockRepo.AssertExpectations(t)
	})
}

func ptrString(s string) *string { return &s }

func TestOrderService_CreateSpecial(t *testing.T) {
	ctx := context.Background()

	gasto := 1200.0
	serviceFee := 450.0

	t.Run("valid create derives total and returns id+folio", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		req := CreateSpecialRequest{CustomerName: "Juan", GastoTerceros: &gasto, ServiceFee: &serviceFee}
		mockRepo.On("CreateSpecial", ctx, req, 1722.0).Return("new-id", 42, nil)

		resp, err := service.CreateSpecial(ctx, req)
		assert.NoError(t, err)
		assert.Equal(t, "new-id", resp.ID)
		assert.Equal(t, 42, resp.Folio)
		mockRepo.AssertExpectations(t)
	})

	t.Run("validation errors skip the repo", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		oob := 101
		req := CreateSpecialRequest{CustomerName: "", ProgressPct: &oob}

		_, err := service.CreateSpecial(ctx, req)
		var verrs ValidationErrors
		assert.True(t, errors.As(err, &verrs))
		assert.GreaterOrEqual(t, len(verrs), 2)
		mockRepo.AssertNotCalled(t, "CreateSpecial", mock.Anything, mock.Anything, mock.Anything)
	})
}

func TestOrderService_Attachments(t *testing.T) {
	ctx := context.Background()

	t.Run("append delegates", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		mockRepo.On("AppendAttachment", ctx, "uuid-1", "u").Return(nil)
		assert.NoError(t, service.AppendAttachment(ctx, "uuid-1", "u"))
		mockRepo.AssertExpectations(t)
	})

	t.Run("remove delegates", func(t *testing.T) {
		mockRepo := new(MockOrderRepo)
		service := NewService(mockRepo)
		mockRepo.On("RemoveAttachment", ctx, "uuid-1", "u").Return(nil)
		assert.NoError(t, service.RemoveAttachment(ctx, "uuid-1", "u"))
		mockRepo.AssertExpectations(t)
	})
}
