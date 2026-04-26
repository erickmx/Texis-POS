package db

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/erickmx/texis-pos/internal/inventory"
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
