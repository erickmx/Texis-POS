package category

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/supabase-community/supabase-go"
)

type Repository interface {
	GetAll(ctx context.Context) ([]Category, error)
	GetByID(ctx context.Context, id string) (*Category, error)
	Create(ctx context.Context, dto CreateCategoryDTO) (*Category, error)
	Update(ctx context.Context, id string, dto UpdateCategoryDTO) (*Category, error)
	Delete(ctx context.Context, id string) error
	GetByProductID(ctx context.Context, productID string) ([]Category, error)
}

type SupabaseCategoryRepository struct {
	client *supabase.Client
}

func NewSupabaseCategoryRepository(client *supabase.Client) Repository {
	return &SupabaseCategoryRepository{client: client}
}

func (r *SupabaseCategoryRepository) GetAll(ctx context.Context) ([]Category, error) {
	data, _, err := r.client.From("categories").Select("*", "exact", false).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to list categories: %w", err)
	}
	var categories []Category
	if err := json.Unmarshal([]byte(data), &categories); err != nil {
		return nil, fmt.Errorf("failed to unmarshal categories: %w", err)
	}
	return categories, nil
}

func (r *SupabaseCategoryRepository) GetByID(ctx context.Context, id string) (*Category, error) {
	data, _, err := r.client.From("categories").Select("*", "exact", false).Eq("id", id).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get category: %w", err)
	}
	var categories []Category
	if err := json.Unmarshal([]byte(data), &categories); err != nil {
		return nil, fmt.Errorf("failed to unmarshal category: %w", err)
	}
	if len(categories) == 0 {
		return nil, ErrCategoryNotFound
	}
	return &categories[0], nil
}

func (r *SupabaseCategoryRepository) Create(ctx context.Context, dto CreateCategoryDTO) (*Category, error) {
	data, _, err := r.client.From("categories").Insert(dto, false, "", "", "").Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to create category: %w", err)
	}
	var categories []Category
	if err := json.Unmarshal([]byte(data), &categories); err != nil {
		return nil, fmt.Errorf("failed to unmarshal created category: %w", err)
	}
	if len(categories) == 0 {
		return nil, fmt.Errorf("failed to create category")
	}
	return &categories[0], nil
}

func (r *SupabaseCategoryRepository) Update(ctx context.Context, id string, dto UpdateCategoryDTO) (*Category, error) {
	updates := make(map[string]interface{})
	if dto.Name != nil {
		updates["name"] = *dto.Name
	}
	if dto.Description != nil {
		updates["description"] = *dto.Description
	}
	data, _, err := r.client.From("categories").Update(updates, "", "").Eq("id", id).Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to update category: %w", err)
	}
	var categories []Category
	if err := json.Unmarshal([]byte(data), &categories); err != nil {
		return nil, fmt.Errorf("failed to unmarshal updated category: %w", err)
	}
	if len(categories) == 0 {
		return nil, ErrCategoryNotFound
	}
	return &categories[0], nil
}

func (r *SupabaseCategoryRepository) Delete(ctx context.Context, id string) error {
	_, _, err := r.client.From("categories").Delete("", "").Eq("id", id).Execute()
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}
	return nil
}

func (r *SupabaseCategoryRepository) GetByProductID(ctx context.Context, productID string) ([]Category, error) {
	data, _, err := r.client.From("product_categories").
		Select("categories!inner(*)", "exact", false).
		Eq("product_id", productID).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get product categories: %w", err)
	}
	// Supabase returns nested categories array with "categories" wrapper when using !inner
	// We need to parse carefully
	var rows []struct {
		Category Category `json:"categories"`
	}
	if err := json.Unmarshal([]byte(data), &rows); err != nil {
		return nil, fmt.Errorf("failed to unmarshal product categories: %w", err)
	}
	categories := make([]Category, len(rows))
	for i, row := range rows {
		categories[i] = row.Category
	}
	return categories, nil
}
