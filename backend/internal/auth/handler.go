package auth

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v3"
)

type LoginDTO struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Website  string `json:"website"` // Honeypot field
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

	clientIP := c.IP()

	token, err := h.service.Login(c.Context(), dto.Username, dto.Password, clientIP, dto.Website)
	if err != nil {
		if err == ErrHoneypotTriggered {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad request"})
		}

		var blockedErr *BlockedError
		if errorsAs(err, &blockedErr) {
			seconds := int(blockedErr.Remaining.Seconds())
			c.Set("Retry-After", string(rune(seconds)))
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":            "Too many failed attempts. Try again in 1 hour.",
				"remainingSeconds": seconds,
			})
		}

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid credentials"})
	}

	return c.JSON(fiber.Map{
		"token": token,
	})
}

func (h *Handler) Refresh(c fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token format"})
	}

	currentToken := parts[1]
	newToken, err := h.service.RefreshToken(c.Context(), currentToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired token"})
	}

	return c.JSON(fiber.Map{
		"token": newToken,
	})
}

// helper to check error type since errors.As needs imports or a wrapper
func errorsAs(err error, target interface{}) bool {
	// A simple interface check to avoid importing "errors" or doing complex casting
	if err == nil {
		return false
	}
	type blocked interface {
		Error() string
		RemainingDuration() time.Duration
	}
	if b, ok := err.(blocked); ok {
		if t, ok := target.(**BlockedError); ok {
			*t = &BlockedError{Remaining: b.RemainingDuration()}
			return true
		}
	}
	return false
}

// Implement RemainingDuration on BlockedError to help helper
func (e *BlockedError) RemainingDuration() time.Duration {
	return e.Remaining
}

