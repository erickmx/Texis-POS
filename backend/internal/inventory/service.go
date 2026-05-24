package inventory

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/erickmx/texis-pos/internal/category"
	"github.com/erickmx/texis-pos/internal/inventory/validation"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrImageNotFound   = errors.New("image not found in storage")
)

type StorageService interface {
	Exists(ctx context.Context, imagePath string) (bool, error)
}

type CategoryRepository interface {
	GetByProductID(ctx context.Context, productID string) ([]category.Category, error)
}

type Service struct {
	repo         ProductRepository
	storage      StorageService
	categoryRepo CategoryRepository
}

func NewService(repo ProductRepository, storage StorageService, categoryRepo CategoryRepository) *Service {
	return &Service{repo: repo, storage: storage, categoryRepo: categoryRepo}
}

func (s *Service) GetAll(ctx context.Context) ([]Product, error) {
	return s.repo.GetAll(ctx)
}

func (s *Service) GetByID(ctx context.Context, id string) (*Product, error) {
	product, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	cats, err := s.categoryRepo.GetByProductID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to load product categories: %w", err)
	}
	product.Categories = cats
	return product, nil
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

	product, err := s.repo.Create(ctx, dto)
	if err != nil {
		return nil, err
	}

	if len(dto.CategoryIDs) > 0 {
		if err := s.repo.SetProductCategories(ctx, product.ID, dto.CategoryIDs); err != nil {
			return nil, fmt.Errorf("failed to set product categories: %w", err)
		}
		cats, _ := s.categoryRepo.GetByProductID(ctx, product.ID)
		product.Categories = cats
	}

	return product, nil
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

	product, err := s.repo.Update(ctx, id, dto)
	if err != nil {
		return nil, err
	}

	if dto.CategoryIDs != nil {
		if err := s.repo.SetProductCategories(ctx, id, dto.CategoryIDs); err != nil {
			return nil, fmt.Errorf("failed to set product categories: %w", err)
		}
	}

	cats, _ := s.categoryRepo.GetByProductID(ctx, id)
	product.Categories = cats
	return product, nil
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

func (s *Service) GetTotal(ctx context.Context) (int64, error) {
	return s.repo.GetTotal(ctx)
}

func (s *Service) GetLowStock(ctx context.Context) ([]Product, error) {
	return s.repo.GetLowStock(ctx)
}

func (s *Service) GetAllFiltered(ctx context.Context, filter validation.ProductFilter) (ProductListResponse, error) {
	products, total, err := s.repo.GetAllFiltered(ctx, filter)
	if err != nil {
		return ProductListResponse{}, err
	}

	totalPages := 0
	if total > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(filter.Limit)))
	}

	return ProductListResponse{
		Data: products,
		Meta: PaginationMeta{
			Page:       filter.Page,
			Limit:      filter.Limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}
