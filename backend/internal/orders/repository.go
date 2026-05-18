package orders

import (
	"context"

	"github.com/erickmx/texis-pos/internal/orders/validation"
)

type OrderRepository interface {
	List(ctx context.Context, filter validation.OrderFilter) ([]Order, int64, error)
}
