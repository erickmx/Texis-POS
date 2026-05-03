package inventory

import (
	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	api := app.Group("/api/products")

	// Get is available for everyone
	api.Get("/", h.GetAll)
	api.Get("/:id", h.GetByID)

	// POST, Update, Logic Delete are for admin only
	api.Post("/", auth.IsAdmin(), h.Create)
	api.Put("/:id", auth.IsAdmin(), h.Update)
	api.Delete("/:id", auth.IsAdmin(), h.Delete)
}

func (h *Handler) GetAll(c fiber.Ctx) error {
	products, err := h.service.GetAll(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(products)
}

func (h *Handler) GetByID(c fiber.Ctx) error {
	id := c.Params("id")
	product, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		if err == ErrProductNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "product not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
