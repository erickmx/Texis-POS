package orders

import (
	"context"
	"errors"
	"testing"

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

func TestOrderService_ListOrders(t *testing.T) {
	mockRepo := new(MockOrderRepo)
	service := NewService(mockRepo)
	ctx := context.Background()
	filter := validation.OrderFilter{Page: 1, Limit: 20, SortBy: "created_at", SortOrder: "desc"}

	t.Run("Success with meta", func(t *testing.T) {
		mockRepo.On("List", ctx, filter).Return([]Order{{Status: "pending"}}, int64(5), nil)
		resp, err := service.ListOrders(ctx, filter)
		assert.NoError(t, err)
		assert.Len(t, resp.Data, 1)
		assert.Equal(t, int64(5), resp.Meta.Total)
		assert.Equal(t, 1, resp.Meta.TotalPages)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error", func(t *testing.T) {
		mockRepo.On("List", ctx, filter).Return([]Order(nil), int64(0), errors.New("db error"))
		resp, err := service.ListOrders(ctx, filter)
		assert.Error(t, err)
		assert.Empty(t, resp.Data)
	})
}
