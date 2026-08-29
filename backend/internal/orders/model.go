package orders

import (
	"bytes"
	"encoding/json"
	"time"
)

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type Order struct {
	ID               string    `json:"id" db:"id"`
	Folio            int       `json:"folio" db:"folio"`
	CustomerWA       *string   `json:"customer_wa,omitempty" db:"customer_wa"`
	CustomerName     *string   `json:"customer_name,omitempty" db:"customer_name"`
	Status           string    `json:"status" db:"status"`
	PaymentMethod    *string   `json:"payment_method,omitempty" db:"payment_method"`
	IsSpecialRequest bool      `json:"is_special_request" db:"is_special_request"`
	TotalAmount      float64   `json:"total_amount" db:"total_amount"`
	FiscalUUID       *string   `json:"fiscal_uuid,omitempty" db:"fiscal_uuid"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

type OrderListResponse struct {
	Data []Order        `json:"data"`
	Meta PaginationMeta `json:"meta"`
}

// SpecialRequestDetail holds the joined detail row for a special order.
type SpecialRequestDetail struct {
	TaskDescription *string    `json:"task_description"`
	Deadline        *time.Time `json:"deadline"`
	Attachments     []string   `json:"attachments"`
	Title           *string    `json:"title"`
	Phase           *string    `json:"phase"`
	ProgressPct     *int       `json:"progress_pct"`
	CompletedAt     *time.Time `json:"completed_at"`
}

// SpecialRequestDetails normalizes the PostgREST embedded payload. The
// special_requests_details.order_id column is a PRIMARY KEY, so the relation
// is to-one and PostgREST embeds a single object; arrays are accepted too for
// forward compatibility.
type SpecialRequestDetails []SpecialRequestDetail

// UnmarshalJSON accepts either a JSON object (to-one embed) or an array.
func (d *SpecialRequestDetails) UnmarshalJSON(data []byte) error {
	trimmed := bytes.TrimSpace(data)
	if len(trimmed) == 0 || string(trimmed) == "null" {
		*d = nil
		return nil
	}
	if trimmed[0] == '[' {
		var list []SpecialRequestDetail
		if err := json.Unmarshal(trimmed, &list); err != nil {
			return err
		}
		*d = list
		return nil
	}
	var one SpecialRequestDetail
	if err := json.Unmarshal(trimmed, &one); err != nil {
		return err
	}
	*d = SpecialRequestDetails{one}
	return nil
}

// SpecialOrder is the postgrest join result (orders + special_requests_details).
type SpecialOrder struct {
	ID                     string                `json:"id"`
	Folio                  int                   `json:"folio"`
	CustomerName           *string               `json:"customer_name"`
	Status                 string                `json:"status"`
	IsSpecialRequest       bool                  `json:"is_special_request"`
	TotalAmount            float64               `json:"total_amount"`
	CreatedAt              time.Time             `json:"created_at"`
	SpecialRequestsDetails SpecialRequestDetails `json:"special_requests_details"`
}

// SpecialOrderResponse is the flat DTO sent to the UI.
type SpecialOrderResponse struct {
	Folio           int        `json:"folio"`
	OrderID         string     `json:"orderId"`
	CustomerName    string     `json:"customerName"`
	Status          string     `json:"status"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Deadline        *time.Time `json:"deadline"`
	AttachmentCount int        `json:"attachmentCount"`
	Phase           *string    `json:"phase"`
	ProgressPct     *int       `json:"progressPct"`
}

// UpdateStatusRequest is the PATCH body for status transitions.
type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// UpdateStatusResponse is returned on a successful status update.
type UpdateStatusResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}
