package main

import (
	"log"
	"os"

	"github.com/erickmx/texis-pos/internal/infrastructure/db"
	storageInfra "github.com/erickmx/texis-pos/internal/infrastructure/storage"
	"github.com/erickmx/texis-pos/internal/inventory"
	"github.com/erickmx/texis-pos/internal/storage"
	"github.com/erickmx/texis-pos/pkg/supabase"
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

	// 4. Initialize Infrastructure
	sbClient := supabase.GetClient()
	productRepo := db.NewSupabaseProductRepository(sbClient)
	storageProvider := storageInfra.NewSupabaseStorageProvider(sbClient)

	// 5. Initialize Services
	storageSvc := storage.NewService(storageProvider)
	inventorySvc := inventory.NewService(productRepo, storageSvc)

	// 6. Initialize Handlers
	storageHandler := storage.NewHandler(storageSvc)
	inventoryHandler := inventory.NewHandler(inventorySvc)

	// 7. Register Routes
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
