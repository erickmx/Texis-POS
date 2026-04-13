package storage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/erickmx/texis-pos/backend/pkg/supabase"
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

type Service struct{}

func NewService() *Service {
	return &Service{}
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

	// 4. Upload to Supabase
	client := supabase.GetClient()
	_, err := client.Storage.UploadFile(InventoryBucket, newFilename, reader)
	if err != nil {
		return "", fmt.Errorf("failed to upload to supabase: %w", err)
	}

	// 5. Get Public URL
	// Note: We'll return the path or full URL. Usually, storage.GetPublicUrl is used.
	publicURL := client.Storage.GetPublicUrl(InventoryBucket, newFilename)
	
	return publicURL.SignedURL, nil
}

// Exists checks if an image exists in the inventory bucket.
func (s *Service) Exists(ctx context.Context, imagePath string) (bool, error) {
	// For Supabase, we can check if the file exists by trying to get its info.
	// However, supabase-go might not have a direct 'Exists' method easily accessible in the wrapper.
	// A common way is to list or try to get public URL.
	// Let's use ListObjects and filter by name as a safe bet if GetFileInfo is missing.
	
	client := supabase.GetClient()
	// Note: imagePath should be the filename in the bucket
	files, err := client.Storage.ListObjects(InventoryBucket, "", nil)
	if err != nil {
		return false, err
	}

	for _, f := range files {
		if f.Name == imagePath {
			return true, nil
		}
	}

	return false, nil
}
