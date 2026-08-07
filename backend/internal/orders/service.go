package orders

import (
	"context"
	"fmt"
	"math"
	"sort"
	"time"

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

// ListSpecialOrders fetches special orders, applies the 30-day DONE cap,
// and returns flat DTOs sorted by deadline ASC (nulls last) within each status group.
func (s *Service) ListSpecialOrders(ctx context.Context) ([]SpecialOrderResponse, error) {
	rawOrders, err := s.repo.ListSpecial(ctx)
	if err != nil {
		return nil, fmt.Errorf("list special orders: %w", err)
	}

	thirtyDaysAgo := time.Now().UTC().AddDate(0, 0, -30)
	var responses []SpecialOrderResponse

	for _, so := range rawOrders {
		// Extract the first (and only) detail row
		var detail SpecialRequestDetail
		if len(so.SpecialRequestsDetails) > 0 {
			detail = so.SpecialRequestsDetails[0]
		}

		// 30-day DONE cap: exclude DONE orders completed more than 30 days ago
		if so.Status == "done" && detail.CompletedAt != nil && detail.CompletedAt.Before(thirtyDaysAgo) {
			continue
		}

		customerName := ""
		if so.CustomerName != nil {
			customerName = *so.CustomerName
		}
		title := ""
		if detail.Title != nil {
			title = *detail.Title
		}
		description := ""
		if detail.TaskDescription != nil {
			description = *detail.TaskDescription
		}
		attachmentCount := 0
		if detail.Attachments != nil {
			attachmentCount = len(detail.Attachments)
		}

		responses = append(responses, SpecialOrderResponse{
			Folio:           so.Folio,
			OrderID:         so.ID,
			CustomerName:    customerName,
			Status:          so.Status,
			Title:           title,
			Description:     description,
			Deadline:        detail.Deadline,
			AttachmentCount: attachmentCount,
			Phase:           detail.Phase,
			ProgressPct:     detail.ProgressPct,
		})
	}

	// Sort by status group (pending, in_progress, done), then by deadline ASC (nulls last) within each group
	sort.SliceStable(responses, func(i, j int) bool {
		// Group ordering: pending=0, in_progress=1, done=2
		gi := statusGroup(responses[i].Status)
		gj := statusGroup(responses[j].Status)
		if gi != gj {
			return gi < gj
		}
		// Within group: deadline ASC, nulls last
		di := responses[i].Deadline
		dj := responses[j].Deadline
		if di == nil && dj == nil {
			return false
		}
		if di == nil {
			return false // nulls last
		}
		if dj == nil {
			return true // nulls last
		}
		return di.Before(*dj)
	})

	return responses, nil
}

// UpdateOrderStatus validates the status and persists the transition.
func (s *Service) UpdateOrderStatus(ctx context.Context, id string, status string) error {
	if errs := validation.ValidateStatus(status); len(errs) > 0 {
		return fmt.Errorf("validation: %s", errs[0].Message)
	}
	return s.repo.UpdateStatus(ctx, id, status)
}

func statusGroup(status string) int {
	switch status {
	case "pending":
		return 0
	case "in_progress":
		return 1
	case "done":
		return 2
	default:
		return 3
	}
}
