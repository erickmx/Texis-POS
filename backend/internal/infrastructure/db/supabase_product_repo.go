package db

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/erickmx/texis-pos/internal/inventory"
	"github.com/erickmx/texis-pos/internal/inventory/validation"
	"github.com/supabase-community/postgrest-go"
	"github.com/supabase-community/supabase-go"
)

type SupabaseProductRepository struct {
	client *supabase.Client
}

func NewSupabaseProductRepository(client *supabase.Client) *SupabaseProductRepository {
	return &SupabaseProductRepository{client: client}
}

func (r *SupabaseProductRepository) GetAll(ctx context.Context) ([]inventory.Product, error) {
	data, _, err := r.client.From("products").Select("*", "exact", false).Eq("is_deleted", "false").Execute()
	if err != nil {
		return nil, err
	}
	var products []inventory.Product
	if err := json.Unmarshal([]byte(data), &products); err != nil {
		return nil, err
	}
	return products, nil
}

func (r *SupabaseProductRepository) GetByID(ctx context.Context, id string) (*inventory.Product, error) {
	data, _, err := r.client.From("products").Select("*", "exact", false).Eq("id", id).Eq("is_deleted", "false").Execute()
	if err != nil {
		return nil, err
	}
	var products []inventory.Product
	if err := json.Unmarshal([]byte(data), &products); err != nil {
		return nil, err
	}
	if len(products) == 0 {
		return nil, inventory.ErrProductNotFound
	}
	return &products[0], nil
}

func (r *SupabaseProductRepository) Create(ctx context.Context, product interface{}) (*inventory.Product, error) {
	data, _, err := r.client.From("products").Insert(product, false, "", "", "").Execute()
	if err != nil {
		return nil, err
	}
	var products []inventory.Product
	if err := json.Unmarshal([]byte(data), &products); err != nil {
		return nil, err
	}
	if len(products) == 0 {
		return nil, fmt.Errorf("failed to create product")
	}
	return &products[0], nil
}

func (r *SupabaseProductRepository) Update(ctx context.Context, id string, product interface{}) (*inventory.Product, error) {
	data, _, err := r.client.From("products").Update(product, "", "").Eq("id", id).Execute()
	if err != nil {
		return nil, err
	}
	var products []inventory.Product
	if err := json.Unmarshal([]byte(data), &products); err != nil {
		return nil, err
	}
	if len(products) == 0 {
		return nil, inventory.ErrProductNotFound
	}
	return &products[0], nil
}

func (r *SupabaseProductRepository) Delete(ctx context.Context, id string) error {
	_, _, err := r.client.From("products").Update(map[string]interface{}{"is_deleted": true}, "", "").Eq("id", id).Execute()
	if err != nil {
		return err
	}
	return nil
}

func (r *SupabaseProductRepository) GetTotal(ctx context.Context) (int64, error) {
	_, count, err := r.client.From("products").
		Select("*", "exact", false).
		Eq("is_deleted", "false").
		Execute()
	if err != nil {
		return 0, fmt.Errorf("failed to count products: %w", err)
	}
	return count, nil
}

func (r *SupabaseProductRepository) GetLowStock(ctx context.Context) ([]inventory.Product, error) {
	data, _, err := r.client.From("products").
		Select("*", "exact", false).
		Lt("stock_level", "reorder_point").
		Eq("is_deleted", "false").
		Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to get low stock products: %w", err)
	}
	var products []inventory.Product
	if err := json.Unmarshal([]byte(data), &products); err != nil {
		return nil, fmt.Errorf("failed to unmarshal low stock products: %w", err)
	}
	return products, nil
}

func (r *SupabaseProductRepository) GetAllFiltered(ctx context.Context, filter validation.ProductFilter) ([]inventory.Product, int64, error) {
	qb := r.client.From("products").
		Select("*", "exact", false).
		Eq("is_deleted", "false")

	if filter.Search != "" {
		qb = qb.Ilike("title", "%"+filter.Search+"%")
	}

	ascending := filter.SortOrder == "asc"
	qb = qb.Order(filter.SortBy, &postgrest.OrderOpts{Ascending: ascending})

	offset := (filter.Page - 1) * filter.Limit
	qb = qb.Range(offset, offset+filter.Limit-1, "")

	data, count, err := qb.Execute()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list products: %w", err)
	}

	var products []inventory.Product
	if err := json.Unmarshal([]byte(data), &products); err != nil {
		return nil, 0, fmt.Errorf("failed to unmarshal products: %w", err)
	}

	return products, count, nil
}
