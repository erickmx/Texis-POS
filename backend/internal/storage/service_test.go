package storage

import (
	"context"
	"errors"
	"io"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockProvider is a mock of the ImageStorageProvider interface.
type MockProvider struct {
	mock.Mock
}

func (m *MockProvider) Upload(ctx context.Context, bucket, filename string, reader io.Reader) (string, error) {
	args := m.Called(ctx, bucket, filename, reader)
	return args.String(0), args.Error(1)
}

func (m *MockProvider) Exists(ctx context.Context, bucket, filename string) (bool, error) {
	args := m.Called(ctx, bucket, filename)
	return args.Bool(0), args.Error(1)
}

func (m *MockProvider) GetPublicUrl(bucket, filename string) string {
	args := m.Called(bucket, filename)
	return args.String(0)
}

func (m *MockProvider) Delete(ctx context.Context, bucket, filename string) error {
	args := m.Called(ctx, bucket, filename)
	return args.Error(0)
}

// Fixed import error by adding missing io import and using it correctly
func TestStorageService_Upload(t *testing.T) {
	ctx := context.Background()

	t.Run("Success - Valid Image", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		reader := strings.NewReader("dummy-data")
		mockProvider.On("Upload", ctx, InventoryBucket, mock.AnythingOfType("string"), reader).Return("http://public-url.com/img.jpg", nil)

		url, err := service.Upload(ctx, reader, "test.jpg", 100)
		assert.NoError(t, err)
		assert.NotEmpty(t, url)
		mockProvider.AssertExpectations(t)
	})

	t.Run("Failure - File Too Large", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		reader := strings.NewReader("dummy-data")
		url, err := service.Upload(ctx, reader, "test.jpg", MaxFileSize+1)
		assert.ErrorIs(t, err, ErrFileTooLarge)
		assert.Empty(t, url)
	})

	t.Run("Failure - Invalid Format", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		reader := strings.NewReader("dummy-data")
		url, err := service.Upload(ctx, reader, "test.txt", 100)
		assert.ErrorIs(t, err, ErrInvalidFormat)
		assert.Empty(t, url)
	})
}

func TestStorageService_Exists(t *testing.T) {
	ctx := context.Background()

	t.Run("True", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		mockProvider.On("Exists", ctx, InventoryBucket, "img.jpg").Return(true, nil)
		exists, err := service.Exists(ctx, "img.jpg")
		assert.NoError(t, err)
		assert.True(t, exists)
		mockProvider.AssertExpectations(t)
	})

	t.Run("False", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		mockProvider.On("Exists", ctx, InventoryBucket, "img.jpg").Return(false, nil)
		exists, err := service.Exists(ctx, "img.jpg")
		assert.NoError(t, err)
		assert.False(t, exists)
		mockProvider.AssertExpectations(t)
	})
}

func TestStorageService_Upload_PngAllowed(t *testing.T) {
	ctx := context.Background()
	mockProvider := new(MockProvider)
	service := NewService(mockProvider)
	reader := strings.NewReader("png-data")
	mockProvider.On("Upload", ctx, InventoryBucket, mock.AnythingOfType("string"), reader).Return("http://public-url.com/img.png", nil)

	url, err := service.Upload(ctx, reader, "photo.png", 100)
	assert.NoError(t, err)
	assert.NotEmpty(t, url)
	mockProvider.AssertExpectations(t)
}

func TestStorageService_Delete(t *testing.T) {
	ctx := context.Background()

	t.Run("delegates to provider", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		mockProvider.On("Delete", ctx, InventoryBucket, "obj.png").Return(nil)
		assert.NoError(t, service.Delete(ctx, "obj.png"))
		mockProvider.AssertExpectations(t)
	})

	t.Run("propagates error", func(t *testing.T) {
		mockProvider := new(MockProvider)
		service := NewService(mockProvider)
		mockProvider.On("Delete", ctx, InventoryBucket, "obj.png").Return(errors.New("boom"))
		assert.Error(t, service.Delete(ctx, "obj.png"))
	})
}
