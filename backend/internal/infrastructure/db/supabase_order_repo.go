package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

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

// ListSpecial fetches orders with is_special_request=true joined with special_requests_details.
func (r *SupabaseOrderRepository) ListSpecial(ctx context.Context) ([]orders.SpecialOrder, error) {
	qb := r.client.From("orders").
		Select(`id,folio,customer_name,status,is_special_request,total_amount,created_at,
			special_requests_details!inner(
				task_description,deadline,attachments,title,phase,progress_pct,completed_at
			)`, "exact", false).
		Eq("is_special_request", "true")

	data, _, err := qb.Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to list special orders: %w", err)
	}

	var result []orders.SpecialOrder
	if err := json.Unmarshal([]byte(data), &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal special orders: %w", err)
	}

	return result, nil
}

// UpdateStatus updates the order status and manages completed_at on the detail row.
func (r *SupabaseOrderRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	// Update orders.status
	_, _, err := r.client.From("orders").
		Update(map[string]interface{}{"status": status}, "", "").
		Eq("id", id).
		Execute()
	if err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Manage completed_at on special_requests_details
	var completedAt interface{}
	if status == "done" {
		completedAt = time.Now().UTC().Format(time.RFC3339)
	}
	// For non-done statuses, completedAt stays nil (clears the field)

	_, _, err = r.client.From("special_requests_details").
		Update(map[string]interface{}{"completed_at": completedAt}, "", "").
		Eq("order_id", id).
		Execute()
	if err != nil {
		return fmt.Errorf("failed to update completed_at: %w", err)
	}

	return nil
}
