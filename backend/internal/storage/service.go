package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
)

const (
	MaxFileSize    = 5 * 1024 * 1024 // 5MB
	InventoryBucket = "inventory-images"
)

var (
	ErrFileTooLarge    = errors.New("file is too large (max 5MB)")
	ErrInvalidFormat   = errors.New("invalid image format (supported: JPEG, JPG, WebP)")
	ErrImageNotFound   = errors.New("image not found in storage")
	AllowedExtensions = map[string]bool{
		".jpeg": true,
		".jpg":  true,
		".webp": true,
	}
)

type Service struct {
	provider ImageStorageProvider
}

func NewService(provider ImageStorageProvider) *Service {
	return &Service{provider: provider}
}

// Upload handles the validation and uploading of an image to Supabase Storage.
func (s *Service) Upload(ctx context.Context, reader io.Reader, originalFilename string, size int64) (string, error) {
	// 1. Validate size
	if size > MaxFileSize {
		return "", ErrFileTooLarge
	}

	// 2. Validate format
	ext := strings.ToLower(filepath.Ext(originalFilename))
	if !AllowedExtensions[ext] {
		return "", ErrInvalidFormat
	}

	// 3. Generate unique name
	newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// 4. Upload to provider
	return s.provider.Upload(ctx, InventoryBucket, newFilename, reader)
}

// Exists checks if an image exists in the inventory bucket.
func (s *Service) Exists(ctx context.Context, imagePath string) (bool, error) {
	return s.provider.Exists(ctx, InventoryBucket, imagePath)
}
