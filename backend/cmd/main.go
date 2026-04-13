package main

import (
	"log"
	"os"

	"github.com/erickmx/texis-pos/backend/internal/inventory"
	"github.com/erickmx/texis-pos/backend/internal/storage"
	"github.com/erickmx/texis-pos/backend/pkg/supabase"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// 1. Initialize Supabase
	if err := supabase.Init(); err != nil {
		log.Fatalf("failed to initialize supabase: %v", err)
	}

	// 2. Initialize Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// 3. Middlewares
	app.Use(logger.New())
	app.Use(recover.New())

	// 4. Initialize Services
	storageSvc := storage.NewService()
	inventorySvc := inventory.NewService(storageSvc)

	// 5. Initialize Handlers
	storageHandler := storage.NewHandler(storageSvc)
	inventoryHandler := inventory.NewHandler(inventorySvc)

	// 6. Register Routes
	storageHandler.RegisterRoutes(app)
	inventoryHandler.RegisterRoutes(app)

	// 7. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
