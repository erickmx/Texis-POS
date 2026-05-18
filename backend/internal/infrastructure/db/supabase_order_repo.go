package db

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/erickmx/texis-pos/internal/orders"
	"github.com/erickmx/texis-pos/internal/orders/validation"
	"github.com/supabase-community/postgrest-go"
	"github.com/supabase-community/supabase-go"
)

type SupabaseOrderRepository struct {
	client *supabase.Client
}

func NewSupabaseOrderRepository(client *supabase.Client) *SupabaseOrderRepository {
	return &SupabaseOrderRepository{client: client}
}

func (r *SupabaseOrderRepository) List(ctx context.Context, filter validation.OrderFilter) ([]orders.Order, int64, error) {
	qb := r.client.From("orders").
		Select("*", "exact", false)

	if filter.Status != "" {
		qb = qb.Eq("status", filter.Status)
	}
	if filter.Search != "" {
		qb = qb.Ilike("customer_name", "%"+filter.Search+"%")
	}

	ascending := filter.SortOrder == "asc"
	qb = qb.Order(filter.SortBy, &postgrest.OrderOpts{Ascending: ascending})

	offset := (filter.Page - 1) * filter.Limit
	qb = qb.Range(offset, offset+filter.Limit-1, "")

	data, count, err := qb.Execute()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list orders: %w", err)
	}

	var orderList []orders.Order
	if err := json.Unmarshal([]byte(data), &orderList); err != nil {
		return nil, 0, fmt.Errorf("failed to unmarshal orders: %w", err)
	}

	return orderList, count, nil
}
