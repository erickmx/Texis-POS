package inventory

import (
	"context"

	"github.com/erickmx/texis-pos/internal/inventory/validation"
)

type ProductRepository interface {
	GetAll(ctx context.Context) ([]Product, error)
	GetByID(ctx context.Context, id string) (*Product, error)
	Create(ctx context.Context, product interface{}) (*Product, error)
	Update(ctx context.Context, id string, product interface{}) (*Product, error)
	Delete(ctx context.Context, id string) error

	GetTotal(ctx context.Context) (int64, error)
	GetLowStock(ctx context.Context) ([]Product, error)
	GetAllFiltered(ctx context.Context, filter validation.ProductFilter) ([]Product, int64, error)
}
