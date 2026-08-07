package orders

import (
	"log"
	"strings"

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
	api.Get("/special", h.ListSpecialOrders)
	api.Patch("/:id/status", h.UpdateOrderStatus)
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
		log.Printf("ListOrders error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(resp)
}

// ListSpecialOrders handles GET /api/orders/special.
func (h *Handler) ListSpecialOrders(c fiber.Ctx) error {
	result, err := h.service.ListSpecialOrders(c.Context())
	if err != nil {
		log.Printf("ListSpecialOrders error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	if result == nil {
		result = []SpecialOrderResponse{}
	}
	return c.JSON(result)
}

// UpdateOrderStatus handles PATCH /api/orders/:id/status.
func (h *Handler) UpdateOrderStatus(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}

	var req UpdateStatusRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": []fiber.Map{
			{"field": "status", "message": "invalid request body"},
		}})
	}

	if errs := validation.ValidateStatus(req.Status); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	err := h.service.UpdateOrderStatus(c.Context(), id, req.Status)
	if err != nil {
		if strings.Contains(err.Error(), "validation:") {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": []fiber.Map{
				{"field": "status", "message": strings.TrimPrefix(err.Error(), "validation: ")},
			}})
		}
		if strings.Contains(err.Error(), "order not found") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "order not found"})
		}
		log.Printf("UpdateOrderStatus error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return c.JSON(UpdateStatusResponse{ID: id, Status: req.Status})
}
