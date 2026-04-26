package inventory

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrImageNotFound   = errors.New("image not found in storage")
)

type StorageService interface {
	Exists(ctx context.Context, imagePath string) (bool, error)
}

type Service struct {
	repo    ProductRepository
	storage StorageService
}

func NewService(repo ProductRepository, storage StorageService) *Service {
	return &Service{repo: repo, storage: storage}
}

func (s *Service) GetAll(ctx context.Context) ([]Product, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Create(ctx context.Context, dto CreateProductDTO) (*Product, error) {
	// 1. Verify image existence if provided
	if dto.ImageURL != "" {
		// Extract path/filename from URL
		imageName := extractFilenameFromURL(dto.ImageURL)
		exists, err := s.storage.Exists(ctx, imageName)
		if err != nil {
			return nil, fmt.Errorf("failed to verify image: %w", err)
		}
		if !exists {
			return nil, ErrImageNotFound
		}
	}

	return s.repo.Create(ctx, dto)
}

func (s *Service) Update(ctx context.Context, id string, dto UpdateProductDTO) (*Product, error) {
	// 1. Verify image existence if provided
	if dto.ImageURL != nil && *dto.ImageURL != "" {
		imageName := extractFilenameFromURL(*dto.ImageURL)
		exists, err := s.storage.Exists(ctx, imageName)
		if err != nil {
			return nil, fmt.Errorf("failed to verify image: %w", err)
		}
		if !exists {
			return nil, ErrImageNotFound
		}
	}

	return s.repo.Update(ctx, id, dto)
}

func (s *Service) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}

func extractFilenameFromURL(imageURL string) string {
	// Assuming URL ends with filename, or has it after the last slash
	parts := strings.Split(imageURL, "/")
	if len(parts) == 0 {
		return imageURL
	}
	// Also strip any query parameters
	lastPart := parts[len(parts)-1]
	if idx := strings.Index(lastPart, "?"); idx != -1 {
		return lastPart[:idx]
	}
	return lastPart
}
