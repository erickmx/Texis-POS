package orders

import (
	"github.com/erickmx/texis-pos/internal/orders/validation"
	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	api := app.Group("/api/orders")
	api.Get("/", h.ListOrders)
}

func (h *Handler) ListOrders(c fiber.Ctx) error {
	values := map[string]string{
		"page":       c.Query("page"),
		"limit":      c.Query("limit"),
		"search":     c.Query("search"),
		"status":     c.Query("status"),
		"sort_by":    c.Query("sort_by"),
		"sort_order": c.Query("sort_order"),
	}
	filter := validation.ParseOrderFilter(values)
	if errs := filter.Validate(); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	resp, err := h.service.ListOrders(c.Context(), filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(resp)
}
