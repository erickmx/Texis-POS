package orders

import "time"

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
