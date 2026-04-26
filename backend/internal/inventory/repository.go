package inventory

import (
	"context"
)

type ProductRepository interface {
	GetAll(ctx context.Context) ([]Product, error)
	GetByID(ctx context.Context, id string) (*Product, error)
	Create(ctx context.Context, product interface{}) (*Product, error)
	Update(ctx context.Context, id string, product interface{}) (*Product, error)
	Delete(ctx context.Context, id string) error
}
