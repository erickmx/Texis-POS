package orders

import (
	"context"
	"math"

	"github.com/erickmx/texis-pos/internal/orders/validation"
)

type Service struct {
	repo OrderRepository
}

func NewService(repo OrderRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListOrders(ctx context.Context, filter validation.OrderFilter) (OrderListResponse, error) {
	ordersList, total, err := s.repo.List(ctx, filter)
	if err != nil {
		return OrderListResponse{}, err
	}

	totalPages := 0
	if total > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(filter.Limit)))
	}

	return OrderListResponse{
		Data: ordersList,
		Meta: PaginationMeta{
			Page:       filter.Page,
			Limit:      filter.Limit,
			Total:      total,
			TotalPages: totalPages,
		},
	}, nil
}
