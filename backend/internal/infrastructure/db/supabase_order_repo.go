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
		Select("id,folio,customer_wa,customer_name,status,is_special_request,total_amount,created_at,special_requests_details!inner(task_description,deadline,attachments,title,phase,progress_pct,completed_at,gasto_terceros,service_fee)", "exact", false).
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
	// Verify the order exists and is a special request
	data, _, err := r.client.From("orders").
		Select("id", "", false).
		Eq("id", id).
		Eq("is_special_request", "true").
		Execute()
	if err != nil {
		return fmt.Errorf("failed to check order existence: %w", err)
	}
	var existing []map[string]interface{}
	if err := json.Unmarshal([]byte(data), &existing); err != nil {
		return fmt.Errorf("failed to parse order check: %w", err)
	}
	if len(existing) == 0 {
		return fmt.Errorf("order not found")
	}

	// Update orders.status
	_, _, err = r.client.From("orders").
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

	_, _, err = r.client.From("special_requests_details").
		Update(map[string]interface{}{"completed_at": completedAt}, "", "").
		Eq("order_id", id).
		Execute()
	if err != nil {
		return fmt.Errorf("failed to update completed_at: %w", err)
	}

	return nil
}

// UpdateDetails persists detail fields and the derived total for a special
// order. It never touches status or completed_at. The orders.total_amount
// update runs only when a fiscal field is present, so sparse payloads (e.g.
// title-only) cannot clobber the stored total.
func (r *SupabaseOrderRepository) UpdateDetails(ctx context.Context, id string, req orders.UpdateDetailsRequest, totalAmount float64) error {
	// Verify the order exists and is a special request
	data, _, err := r.client.From("orders").
		Select("id", "", false).
		Eq("id", id).
		Eq("is_special_request", "true").
		Execute()
	if err != nil {
		return fmt.Errorf("failed to check order existence: %w", err)
	}
	var existing []map[string]interface{}
	if err := json.Unmarshal([]byte(data), &existing); err != nil {
		return fmt.Errorf("failed to parse order check: %w", err)
	}
	if len(existing) == 0 {
		return fmt.Errorf("order not found")
	}

	if req.GastoTerceros != nil || req.ServiceFee != nil {
		if _, _, err := r.client.From("orders").
			Update(map[string]interface{}{"total_amount": totalAmount}, "", "").
			Eq("id", id).
			Execute(); err != nil {
			return fmt.Errorf("failed to update order total: %w", err)
		}
	}

	details := map[string]interface{}{}
	if req.Title != nil {
		details["title"] = *req.Title
	}
	if req.TaskDescription != nil {
		details["task_description"] = *req.TaskDescription
	}
	if req.Phase != nil {
		details["phase"] = *req.Phase
	}
	if req.Deadline.Set {
		if req.Deadline.Value == nil {
			details["deadline"] = nil
		} else {
			details["deadline"] = req.Deadline.Value.UTC().Format(time.RFC3339)
		}
	}
	if req.ProgressPct.Set {
		if req.ProgressPct.Value == nil {
			details["progress_pct"] = nil
		} else {
			details["progress_pct"] = *req.ProgressPct.Value
		}
	}
	if req.GastoTerceros != nil {
		details["gasto_terceros"] = *req.GastoTerceros
	}
	if req.ServiceFee != nil {
		details["service_fee"] = *req.ServiceFee
	}
	if len(details) == 0 {
		return nil
	}

	if _, _, err := r.client.From("special_requests_details").
		Update(details, "", "").
		Eq("order_id", id).
		Execute(); err != nil {
		return fmt.Errorf("failed to update special request details: %w", err)
	}
	return nil
}

// CreateSpecial inserts the orders row (server-generated folio, status
// pending) then the details row keyed by order_id. Non-transactional per the
// accepted convention: a details failure leaves an orders row that the board
// hides (!inner join).
func (r *SupabaseOrderRepository) CreateSpecial(ctx context.Context, req orders.CreateSpecialRequest, totalAmount float64) (string, int, error) {
	orderPayload := map[string]interface{}{
		"customer_name":      req.CustomerName,
		"status":             "pending",
		"is_special_request": true,
		"total_amount":       totalAmount,
	}
	if req.CustomerWA != nil {
		orderPayload["customer_wa"] = *req.CustomerWA
	}

	data, _, err := r.client.From("orders").
		Insert(orderPayload, false, "", "representation", "").
		Execute()
	if err != nil {
		return "", 0, fmt.Errorf("failed to create order: %w", err)
	}
	var created []struct {
		ID    string `json:"id"`
		Folio int    `json:"folio"`
	}
	if err := json.Unmarshal([]byte(data), &created); err != nil || len(created) == 0 {
		return "", 0, fmt.Errorf("failed to parse created order")
	}
	id := created[0].ID

	gasto := 0.0
	if req.GastoTerceros != nil {
		gasto = *req.GastoTerceros
	}
	serviceFee := 0.0
	if req.ServiceFee != nil {
		serviceFee = *req.ServiceFee
	}
	attachments := req.Attachments
	if attachments == nil {
		attachments = []string{}
	}

	details := map[string]interface{}{
		"order_id":       id,
		"gasto_terceros": gasto,
		"service_fee":    serviceFee,
		"attachments":    attachments,
	}
	if req.Title != nil {
		details["title"] = *req.Title
	}
	if req.TaskDescription != nil {
		details["task_description"] = *req.TaskDescription
	}
	if req.Deadline != nil {
		details["deadline"] = req.Deadline.UTC().Format(time.RFC3339)
	}
	if req.Phase != nil {
		details["phase"] = *req.Phase
	}
	if req.ProgressPct != nil {
		details["progress_pct"] = *req.ProgressPct
	}

	if _, _, err := r.client.From("special_requests_details").
		Insert(details, false, "", "minimal", "").
		Execute(); err != nil {
		return "", 0, fmt.Errorf("failed to create special request details: %w", err)
	}
	return id, created[0].Folio, nil
}

// AppendAttachment links url to the order's attachments (read-modify-write;
// single-location POS race accepted by design).
func (r *SupabaseOrderRepository) AppendAttachment(ctx context.Context, id string, url string) error {
	current, err := r.fetchAttachments(id)
	if err != nil {
		return err
	}
	return r.updateAttachments(id, append(current, url))
}

// RemoveAttachment unlinks url (idempotent when absent).
func (r *SupabaseOrderRepository) RemoveAttachment(ctx context.Context, id string, url string) error {
	current, err := r.fetchAttachments(id)
	if err != nil {
		return err
	}
	kept := make([]string, 0, len(current))
	for _, a := range current {
		if a != url {
			kept = append(kept, a)
		}
	}
	return r.updateAttachments(id, kept)
}

// fetchAttachments returns the current attachments for a special order's
// details row; an absent row yields the "order not found" sentinel.
func (r *SupabaseOrderRepository) fetchAttachments(id string) ([]string, error) {
	data, _, err := r.client.From("special_requests_details").
		Select("attachments", "", false).
		Eq("order_id", id).
		Execute()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch attachments: %w", err)
	}
	var rows []struct {
		Attachments []string `json:"attachments"`
	}
	if err := json.Unmarshal([]byte(data), &rows); err != nil {
		return nil, fmt.Errorf("failed to parse attachments: %w", err)
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("order not found")
	}
	return rows[0].Attachments, nil
}

func (r *SupabaseOrderRepository) updateAttachments(id string, attachments []string) error {
	if _, _, err := r.client.From("special_requests_details").
		Update(map[string]interface{}{"attachments": attachments}, "", "").
		Eq("order_id", id).
		Execute(); err != nil {
		return fmt.Errorf("failed to update attachments: %w", err)
	}
	return nil
}
