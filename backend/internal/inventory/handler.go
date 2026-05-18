package inventory

import (
	"log"

	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/erickmx/texis-pos/internal/inventory/validation"
	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	service     *Service
	authService auth.AuthService
}

func NewHandler(service *Service, authService auth.AuthService) *Handler {
	return &Handler{
		service:     service,
		authService: authService,
	}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	api := app.Group("/api/products")

	// Static routes FIRST (before /:id)
	api.Get("/total", h.GetTotal)
	api.Get("/stock/low", h.GetLowStock)
	api.Get("/", h.GetAll)
	api.Get("/:id", h.GetByID)

	// POST, Update, Logic Delete are for admin only
	api.Post("/", auth.IsAdmin(h.authService), h.Create)
	api.Put("/:id", auth.IsAdmin(h.authService), h.Update)
	api.Delete("/:id", auth.IsAdmin(h.authService), h.Delete)
}

func (h *Handler) GetTotal(c fiber.Ctx) error {
	total, err := h.service.GetTotal(c.Context())
	if err != nil {
		log.Printf("GetTotal error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(fiber.Map{"total": total})
}

func (h *Handler) GetLowStock(c fiber.Ctx) error {
	products, err := h.service.GetLowStock(c.Context())
	if err != nil {
		log.Printf("GetLowStock error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(products)
}

func (h *Handler) GetAll(c fiber.Ctx) error {
	values := map[string]string{
		"page":       c.Query("page"),
		"limit":      c.Query("limit"),
		"search":     c.Query("search"),
		"sort_by":    c.Query("sort_by"),
		"sort_order": c.Query("sort_order"),
	}
	filter := validation.ParseProductFilter(values)
	if errs := filter.Validate(); len(errs) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errs})
	}

	resp, err := h.service.GetAllFiltered(c.Context(), filter)
	if err != nil {
		log.Printf("GetAll error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(resp)
}

func (h *Handler) GetByID(c fiber.Ctx) error {
	id := c.Params("id")
	product, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		if err == ErrProductNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
		}
		log.Printf("GetByID error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(product)
}

func (h *Handler) Create(c fiber.Ctx) error {
	dto := new(CreateProductDTO)
	if err := c.Bind().Body(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse body"})
	}

	product, err := h.service.Create(c.Context(), *dto)
	if err != nil {
		if err == ErrImageNotFound {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "image does not exist in storage"})
		}
		log.Printf("Create error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.Status(fiber.StatusCreated).JSON(product)
}

func (h *Handler) Update(c fiber.Ctx) error {
	id := c.Params("id")
	dto := new(UpdateProductDTO)
	if err := c.Bind().Body(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse body"})
	}

	product, err := h.service.Update(c.Context(), id, *dto)
	if err != nil {
		if err == ErrProductNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
		}
		if err == ErrImageNotFound {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "image does not exist in storage"})
		}
		log.Printf("Update error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(product)
}

func (h *Handler) Delete(c fiber.Ctx) error {
	id := c.Params("id")
	err := h.service.Delete(c.Context(), id)
	if err != nil {
		if err == ErrProductNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
		}
		log.Printf("Delete error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
