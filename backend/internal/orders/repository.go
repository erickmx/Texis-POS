package orders

import (
	"context"

	"github.com/erickmx/texis-pos/internal/orders/validation"
)

type OrderRepository interface {
	List(ctx context.Context, filter validation.OrderFilter) ([]Order, int64, error)
	ListSpecial(ctx context.Context) ([]SpecialOrder, error)
	UpdateStatus(ctx context.Context, id string, status string) error
	UpdateDetails(ctx context.Context, id string, req UpdateDetailsRequest, totalAmount float64) error
	CreateSpecial(ctx context.Context, req CreateSpecialRequest, totalAmount float64) (string, int, error)
	AppendAttachment(ctx context.Context, id string, url string) error
	RemoveAttachment(ctx context.Context, id string, url string) error
}
