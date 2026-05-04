package auth

import (
	"github.com/gofiber/fiber/v3"
)

type LoginDTO struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Handler struct {
	service AuthService
}

func NewHandler(service AuthService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Login(c fiber.Ctx) error {
	dto := new(LoginDTO)
	if err := c.Bind().Body(dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot parse body"})
	}

	token, err := h.service.Login(c.Context(), dto.Username, dto.Password)
	if err != nil {
		return c.SendStatus(fiber.StatusUnauthorized)
	}

	return c.JSON(fiber.Map{
		"token": token,
	})
}
