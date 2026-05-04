package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/erickmx/texis-pos/internal/infrastructure/db"
	storageInfra "github.com/erickmx/texis-pos/internal/infrastructure/storage"
	"github.com/erickmx/texis-pos/internal/inventory"
	"github.com/erickmx/texis-pos/internal/storage"
	"github.com/erickmx/texis-pos/pkg/supabase"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/helmet"
	"github.com/gofiber/fiber/v3/middleware/limiter"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
)

func main() {
	// 1. Initialize Supabase
	if err := supabase.Init(); err != nil {
		log.Fatalf("failed to initialize supabase: %v", err)
	}

	// 2. Initialize Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c fiber.Ctx, err error) error {
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
	app.Use(helmet.New())

	// CORS whitelist from env
	whitelist := os.Getenv("CORS_WHITELIST")
	if whitelist == "" {
		whitelist = "http://localhost:3000"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins: strings.Split(whitelist, ","),
	}))

	// Rate Limiter: 100 requests per 60 seconds
	app.Use(limiter.New(limiter.Config{
		Max: 100,
		Expiration: 60 * time.Second,
	}))

	// 4. Initialize Infrastructure
	sbClient := supabase.GetClient()
	productRepo := db.NewSupabaseProductRepository(sbClient)
	storageProvider := storageInfra.NewSupabaseStorageProvider(sbClient)

	// 5. Initialize Services
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET must be set")
	}

	authSvc := auth.NewService(
		jwtSecret,
		os.Getenv("ADMIN_USERNAME"),
		os.Getenv("ADMIN_PASSWORD"),
		os.Getenv("SELLER_USERNAME"),
		os.Getenv("SELLER_PASSWORD"),
	)
	storageSvc := storage.NewService(storageProvider)
	inventorySvc := inventory.NewService(productRepo, storageSvc)

	// 6. Initialize Handlers
	authHandler := auth.NewHandler(authSvc)
	storageHandler := storage.NewHandler(storageSvc, authSvc)
	inventoryHandler := inventory.NewHandler(inventorySvc, authSvc)

	// 7. Register Routes
	app.Post("/api/login", authHandler.Login)
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
