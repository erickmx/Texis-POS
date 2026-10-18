package orders

import (
	"bytes"
	"encoding/json"
	"time"

	"github.com/erickmx/texis-pos/internal/orders/validation"
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
	GastoTerceros   *float64   `json:"gasto_terceros"`
	ServiceFee      *float64   `json:"service_fee"`
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
	CustomerWA             *string               `json:"customer_wa"`
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
	CustomerWA      string     `json:"customerWa"`
	Status          string     `json:"status"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	Deadline        *time.Time `json:"deadline"`
	AttachmentCount int        `json:"attachmentCount"`
	Attachments     []string   `json:"attachments"`
	Phase           *string    `json:"phase"`
	ProgressPct     *int       `json:"progressPct"`
	GastoTerceros   float64    `json:"gastoTerceros"`
	ServiceFee      float64    `json:"serviceFee"`
}

// NullableTime distinguishes an absent field (Set=false) from an explicit
// JSON null (Set=true, Value=nil). Explicit nulls persist as SQL NULL.
type NullableTime struct {
	Set   bool
	Value *time.Time
}

func (t *NullableTime) UnmarshalJSON(data []byte) error {
	t.Set = true
	trimmed := bytes.TrimSpace(data)
	if string(trimmed) == "null" {
		t.Value = nil
		return nil
	}
	var v time.Time
	if err := json.Unmarshal(trimmed, &v); err != nil {
		return err
	}
	t.Value = &v
	return nil
}

// NullableInt distinguishes an absent field (Set=false) from an explicit
// JSON null (Set=true, Value=nil). Explicit nulls persist as SQL NULL.
type NullableInt struct {
	Set   bool
	Value *int
}

func (n *NullableInt) UnmarshalJSON(data []byte) error {
	n.Set = true
	trimmed := bytes.TrimSpace(data)
	if string(trimmed) == "null" {
		n.Value = nil
		return nil
	}
	var v int
	if err := json.Unmarshal(trimmed, &v); err != nil {
		return err
	}
	n.Value = &v
	return nil
}

// UpdateDetailsRequest is the PATCH body for special request details.
// Pointer fields are absent-skipped; Nullable* fields distinguish an absent
// field from an explicit null (which persists as SQL NULL).
type UpdateDetailsRequest struct {
	Title           *string      `json:"title"`
	TaskDescription *string      `json:"task_description"`
	Deadline        NullableTime `json:"deadline"`
	Phase           *string      `json:"phase"`
	ProgressPct     NullableInt  `json:"progress_pct"`
	GastoTerceros   *float64     `json:"gasto_terceros"`
	ServiceFee      *float64     `json:"service_fee"`
}

// UpdateDetailsResponse is returned on a successful details update.
type UpdateDetailsResponse struct {
	ID          string  `json:"id"`
	TotalAmount float64 `json:"total_amount"`
}

// ValidationErrors carries structured field failures through the service so
// the handler can render the same {"errors":[{field,message}]} shape as
// ListOrders. It implements error so it survives errors.As.
type ValidationErrors []validation.FieldError

func (v ValidationErrors) Error() string {
	if len(v) == 0 {
		return "no validation errors"
	}
	return v[0].Field + ": " + v[0].Message
}

// UpdateStatusRequest is the PATCH body for status transitions.
type UpdateStatusRequest struct {
	Status string `json:"status"`
}

// CreateSpecialRequest is the POST body for creating a special request.
// status/folio/completed_at are deliberately not acceptable: the server sets them.
type CreateSpecialRequest struct {
	Title           *string    `json:"title"`
	TaskDescription *string    `json:"task_description"`
	Deadline        *time.Time `json:"deadline"`
	Phase           *string    `json:"phase"`
	ProgressPct     *int       `json:"progress_pct"`
	GastoTerceros   *float64   `json:"gasto_terceros"`
	ServiceFee      *float64   `json:"service_fee"`
	CustomerName    string     `json:"customer_name"`
	CustomerWA      *string    `json:"customer_wa"`
	Attachments     []string   `json:"attachments"`
}

// CreateSpecialResponse returns the created order identity.
type CreateSpecialResponse struct {
	ID    string `json:"id"`
	Folio int    `json:"folio"`
}

// DeleteAttachmentRequest is the DELETE body for attachment removal.
type DeleteAttachmentRequest struct {
	URL string `json:"url"`
}

// UpdateStatusResponse is returned on a successful status update.
type UpdateStatusResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}
