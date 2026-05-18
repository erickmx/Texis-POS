package inventory

import (
	"context"
	"errors"
	"testing"

	"github.com/erickmx/texis-pos/internal/inventory/validation"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRepo is a mock of the ProductRepository interface.
type MockRepo struct {
	mock.Mock
}

func (m *MockRepo) GetAll(ctx context.Context) ([]Product, error) {
	args := m.Called(ctx)
	return args.Get(0).([]Product), args.Error(1)
}

func (m *MockRepo) GetByID(ctx context.Context, id string) (*Product, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Product), args.Error(1)
}

func (m *MockRepo) Create(ctx context.Context, product interface{}) (*Product, error) {
	args := m.Called(ctx, product)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Product), args.Error(1)
}

func (m *MockRepo) Update(ctx context.Context, id string, product interface{}) (*Product, error) {
	args := m.Called(ctx, id, product)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Product), args.Error(1)
}

func (m *MockRepo) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRepo) GetTotal(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockRepo) GetLowStock(ctx context.Context) ([]Product, error) {
	args := m.Called(ctx)
	return args.Get(0).([]Product), args.Error(1)
}

func (m *MockRepo) GetAllFiltered(ctx context.Context, filter validation.ProductFilter) ([]Product, int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).([]Product), args.Get(1).(int64), args.Error(2)
}

// MockStorage is a mock of the StorageService interface.
type MockStorage struct {
	mock.Mock
}

func (m *MockStorage) Exists(ctx context.Context, imagePath string) (bool, error) {
	args := m.Called(ctx, imagePath)
	return args.Bool(0), args.Error(1)
}

func TestInventoryService_Create(t *testing.T) {
	mockRepo := new(MockRepo)
	mockStorage := new(MockStorage)
	service := NewService(mockRepo, mockStorage)
	ctx := context.Background()

	t.Run("Success - No Image", func(t *testing.T) {
		dto := CreateProductDTO{Title: "No Image"}
		mockRepo.On("Create", ctx, dto).Return(&Product{Title: "No Image"}, nil)

		product, err := service.Create(ctx, dto)
		assert.NoError(t, err)
		assert.Equal(t, "No Image", product.Title)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Success - Valid Image", func(t *testing.T) {
		dto := CreateProductDTO{Title: "Valid Image", ImageURL: "http://storage.com/img.jpg"}
		mockStorage.On("Exists", ctx, "img.jpg").Return(true, nil)
		mockRepo.On("Create", ctx, dto).Return(&Product{Title: "Valid Image"}, nil)

		product, err := service.Create(ctx, dto)
		assert.NoError(t, err)
		assert.Equal(t, "Valid Image", product.Title)
		mockStorage.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Failure - Image Not Found", func(t *testing.T) {
		dto := CreateProductDTO{Title: "Invalid Image", ImageURL: "http://storage.com/missing.jpg"}
		mockStorage.On("Exists", ctx, "missing.jpg").Return(false, nil)

		product, err := service.Create(ctx, dto)
		assert.ErrorIs(t, err, ErrImageNotFound)
		assert.Nil(t, product)
	})
}

func TestInventoryService_Delete(t *testing.T) {
	mockRepo := new(MockRepo)
	mockStorage := new(MockStorage)
	service := NewService(mockRepo, mockStorage)
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		mockRepo.On("Delete", ctx, "123").Return(nil)
		err := service.Delete(ctx, "123")
		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestInventoryService_GetTotal(t *testing.T) {
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		mockRepo := new(MockRepo)
		service := NewService(mockRepo, nil)
		mockRepo.On("GetTotal", ctx).Return(int64(42), nil)
		total, err := service.GetTotal(ctx)
		assert.NoError(t, err)
		assert.Equal(t, int64(42), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error", func(t *testing.T) {
		mockRepo := new(MockRepo)
		service := NewService(mockRepo, nil)
		mockRepo.On("GetTotal", ctx).Return(int64(0), errors.New("db error"))
		total, err := service.GetTotal(ctx)
		assert.Error(t, err)
		assert.Equal(t, int64(0), total)
	})
}

func TestInventoryService_GetLowStock(t *testing.T) {
	ctx := context.Background()

	t.Run("Success", func(t *testing.T) {
		mockRepo := new(MockRepo)
		service := NewService(mockRepo, nil)
		mockRepo.On("GetLowStock", ctx).Return([]Product{{Title: "Low"}}, nil)
		products, err := service.GetLowStock(ctx)
		assert.NoError(t, err)
		assert.Len(t, products, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error", func(t *testing.T) {
		mockRepo := new(MockRepo)
		service := NewService(mockRepo, nil)
		mockRepo.On("GetLowStock", ctx).Return([]Product(nil), errors.New("db error"))
		products, err := service.GetLowStock(ctx)
		assert.Error(t, err)
		assert.Nil(t, products)
	})
}

func TestInventoryService_GetAllFiltered(t *testing.T) {
	ctx := context.Background()
	filter := validation.ProductFilter{Page: 2, Limit: 10, SortBy: "created_at", SortOrder: "desc"}

	t.Run("Success with meta", func(t *testing.T) {
		mockRepo := new(MockRepo)
		service := NewService(mockRepo, nil)
		mockRepo.On("GetAllFiltered", ctx, filter).Return([]Product{{Title: "A"}}, int64(25), nil)
		resp, err := service.GetAllFiltered(ctx, filter)
		assert.NoError(t, err)
		assert.Len(t, resp.Data, 1)
		assert.Equal(t, 2, resp.Meta.Page)
		assert.Equal(t, 10, resp.Meta.Limit)
		assert.Equal(t, int64(25), resp.Meta.Total)
		assert.Equal(t, 3, resp.Meta.TotalPages)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error", func(t *testing.T) {
		mockRepo := new(MockRepo)
		service := NewService(mockRepo, nil)
		mockRepo.On("GetAllFiltered", ctx, filter).Return([]Product(nil), int64(0), errors.New("db error"))
		resp, err := service.GetAllFiltered(ctx, filter)
		assert.Error(t, err)
		assert.Empty(t, resp.Data)
	})
}
