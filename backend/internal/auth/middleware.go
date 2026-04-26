package auth

import (
	"github.com/gofiber/fiber/v2"
)

// IsAdmin is a mocked middleware that checks for an admin role.
// It checks for a simulated 'X-Role' header and validates that it's 'admin'.
// In a real scenario, this would check a JWT session and a database role.
func IsAdmin() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Mocked check: Assume 'X-Role' header contains the role
		role := c.Get("X-Role")
		if role != "admin" {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: Admin access required",
			})
		}

		// Mocked check: Simulate session check (e.g., checking if token is present)
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: Missing session token",
			})
		}

		return c.Next()
	}
}
