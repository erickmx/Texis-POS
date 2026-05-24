package category

import (
	"log"

	"github.com/erickmx/texis-pos/internal/auth"
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
	api := app.Group("/api/categories")

	api.Get("/", h.List)
	api.Get("/:id", h.GetByID)

	// Mutations require authenticated user (per user clarification)
	api.Post("/", auth.IsAuthenticated(h.authService), h.Create)
	api.Put("/:id", auth.IsAuthenticated(h.authService), h.Update)
	api.Delete("/:id", auth.IsAuthenticated(h.authService), h.Delete)
}

func (h *Handler) List(c fiber.Ctx) error {
	categories, err := h.service.GetAll(c.Context())
	if err != nil {
		log.Printf("List categories error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(categories)
}

func (h *Handler) GetByID(c fiber.Ctx) error {
	id := c.Params("id")
	category, err := h.service.GetByID(c.Context(), id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "category not found"})
		}
		log.Printf("GetByID category error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(category)
}

func (h *Handler) Create(c fiber.Ctx) error {
	dto := new(CreateCategoryDTO)
	if err := c.Bind().Body(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse body"})
	}

	category, err := h.service.Create(c.Context(), *dto)
	if err != nil {
		log.Printf("Create category error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.Status(fiber.StatusCreated).JSON(category)
}

func (h *Handler) Update(c fiber.Ctx) error {
	id := c.Params("id")
	dto := new(UpdateCategoryDTO)
	if err := c.Bind().Body(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse body"})
	}

	category, err := h.service.Update(c.Context(), id, *dto)
	if err != nil {
		if err == ErrCategoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "category not found"})
		}
		log.Printf("Update category error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.JSON(category)
}

func (h *Handler) Delete(c fiber.Ctx) error {
	id := c.Params("id")
	err := h.service.Delete(c.Context(), id)
	if err != nil {
		if err == ErrCategoryNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "category not found"})
		}
		log.Printf("Delete category error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
