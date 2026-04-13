package inventory

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/erickmx/texis-pos/backend/pkg/supabase"
)

var (
	ErrProductNotFound = errors.New("product not found")
	ErrImageNotFound   = errors.New("image not found in storage")
)

type StorageService interface {
	Exists(ctx context.Context, imagePath string) (bool, error)
}

type Service struct {
	storage StorageService
}

func NewService(storage StorageService) *Service {
	return &Service{storage: storage}
}

func (s *Service) GetAll(ctx context.Context) ([]Product, error) {
	client := supabase.GetClient()
	var products []Product
	err := client.DB.From("products").Select("*").Eq("is_deleted", "false").Execute(&products)
	return products, err
}

func (s *Service) GetByID(ctx context.Context, id string) (*Product, error) {
	client := supabase.GetClient()
	var products []Product
	err := client.DB.From("products").Select("*").Eq("id", id).Eq("is_deleted", "false").Execute(&products)
	if err != nil {
		return nil, err
	}
	if len(products) == 0 {
		return nil, ErrProductNotFound
	}
	return &products[0], nil
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

	client := supabase.GetClient()
	var products []Product
	err := client.DB.From("products").Insert(dto).Execute(&products)
	if err != nil {
		return nil, err
	}
	if len(products) == 0 {
		return nil, fmt.Errorf("failed to create product")
	}
	return &products[0], nil
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

	client := supabase.GetClient()
	var products []Product
	err := client.DB.From("products").Update(dto).Eq("id", id).Execute(&products)
	if err != nil {
		return nil, err
	}
	if len(products) == 0 {
		return nil, ErrProductNotFound
	}
	return &products[0], nil
}

func (s *Service) Delete(ctx context.Context, id string) error {
	client := supabase.GetClient()
	var products []Product
	// Logic delete
	err := client.DB.From("products").Update(map[string]interface{}{"is_deleted": true}).Eq("id", id).Execute(&products)
	if err != nil {
		return err
	}
	if len(products) == 0 {
		return ErrProductNotFound
	}
	return nil
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
