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
				SpecialRequestsDetails: []SpecialRequestDetail{
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
				SpecialRequestsDetails: []SpecialRequestDetail{{CompletedAt: &oldTime}},
			},
			{
				ID: "recent", Folio: 2, Status: "done",
				SpecialRequestsDetails: []SpecialRequestDetail{{CompletedAt: &recentTime}},
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
			{ID: "a", Folio: 1, Status: "pending", SpecialRequestsDetails: []SpecialRequestDetail{{Deadline: &d1}}},
			{ID: "b", Folio: 2, Status: "pending", SpecialRequestsDetails: []SpecialRequestDetail{{Deadline: &d2}}},
			{ID: "c", Folio: 3, Status: "pending", SpecialRequestsDetails: []SpecialRequestDetail{{Deadline: nil}}},
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
			{ID: "x", Folio: 5, Status: "pending", SpecialRequestsDetails: []SpecialRequestDetail{}},
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
