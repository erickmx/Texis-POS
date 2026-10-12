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

		attachments := []string{}
		if detail.Attachments != nil {
			attachments = detail.Attachments
		}
		customerWa := ""
		if so.CustomerWA != nil {
			customerWa = *so.CustomerWA
		}
		gasto := 0.0
		if detail.GastoTerceros != nil {
			gasto = *detail.GastoTerceros
		}
		service := 0.0
		if detail.ServiceFee != nil {
			service = *detail.ServiceFee
		}

		responses = append(responses, SpecialOrderResponse{
			Folio:           so.Folio,
			OrderID:         so.ID,
			CustomerName:    customerName,
			CustomerWA:      customerWa,
			Status:          so.Status,
			Title:           title,
			Description:     description,
			Deadline:        detail.Deadline,
			AttachmentCount: attachmentCount,
			Attachments:     attachments,
			Phase:           detail.Phase,
			ProgressPct:     detail.ProgressPct,
			GastoTerceros:   gasto,
			ServiceFee:      service,
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

// UpdateOrderDetails validates the PATCH payload, derives the fiscal total
// (IVA on service fee only) and persists the detail fields. Status and
// completed_at are never touched. Returns the total derived from the payload.
func (s *Service) UpdateOrderDetails(ctx context.Context, id string, req UpdateDetailsRequest) (float64, error) {
	var progressPtr *int
	if req.ProgressPct.Set && req.ProgressPct.Value != nil {
		progressPtr = req.ProgressPct.Value
	}
	if errs := validation.ValidateDetailsRequest(req.Title, req.Phase, progressPtr, req.GastoTerceros, req.ServiceFee); len(errs) > 0 {
		return 0, ValidationErrors(errs)
	}

	gastoCents := dollarsToCents(req.GastoTerceros)
	serviceCents := dollarsToCents(req.ServiceFee)
	total := float64(ComputeTotalCents(gastoCents, serviceCents)) / 100

	if err := s.repo.UpdateDetails(ctx, id, req, total); err != nil {
		return 0, err
	}
	return total, nil
}

// CreateSpecial validates the create payload, derives the fiscal total and
// persists the orders row plus its details row. Returns the new id and folio.
func (s *Service) CreateSpecial(ctx context.Context, req CreateSpecialRequest) (CreateSpecialResponse, error) {
	if errs := validation.ValidateCreateRequest(req.CustomerName, req.Title, req.ProgressPct, req.GastoTerceros, req.ServiceFee, req.Attachments); len(errs) > 0 {
		return CreateSpecialResponse{}, ValidationErrors(errs)
	}

	total := float64(ComputeTotalCents(dollarsToCents(req.GastoTerceros), dollarsToCents(req.ServiceFee))) / 100

	id, folio, err := s.repo.CreateSpecial(ctx, req, total)
	if err != nil {
		return CreateSpecialResponse{}, err
	}
	return CreateSpecialResponse{ID: id, Folio: folio}, nil
}

// AppendAttachment links a stored URL to the order's attachments.
func (s *Service) AppendAttachment(ctx context.Context, id string, url string) error {
	return s.repo.AppendAttachment(ctx, id, url)
}

// RemoveAttachment unlinks a URL from the order's attachments.
func (s *Service) RemoveAttachment(ctx context.Context, id string, url string) error {
	return s.repo.RemoveAttachment(ctx, id, url)
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
