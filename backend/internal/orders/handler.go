package orders

import (
	"errors"
	"fmt"
	"log"
	"net/url"
	"path"
	"strings"

	"github.com/erickmx/texis-pos/internal/auth"
	"github.com/erickmx/texis-pos/internal/orders/validation"
	"github.com/erickmx/texis-pos/internal/storage"
	"github.com/gofiber/fiber/v3"
)

type Handler struct {
	service     *Service
	authService auth.AuthService
	storageSvc  *storage.Service
}

func NewHandler(service *Service, authService auth.AuthService, storageSvc *storage.Service) *Handler {
	return &Handler{service: service, authService: authService, storageSvc: storageSvc}
}

func (h *Handler) RegisterRoutes(app *fiber.App) {
	// Every orders route requires a valid JWT of any role (closes the
	// standing unauthenticated-orders gap).
	api := app.Group("/api/orders", auth.IsAuthenticated(h.authService))
	api.Get("/", h.ListOrders)
	api.Get("/special", h.ListSpecialOrders)
	api.Post("/special", h.CreateSpecialOrder)
	api.Patch("/:id/status", h.UpdateOrderStatus)
	api.Patch("/:id/details", h.UpdateOrderDetails)
	api.Post("/:id/attachments", h.UploadAttachment)
	api.Delete("/:id/attachments", h.DeleteAttachment)
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

// UpdateOrderDetails handles PATCH /api/orders/:id/details.
func (h *Handler) UpdateOrderDetails(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}

	var req UpdateDetailsRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": []fiber.Map{
			{"field": "body", "message": "invalid request body"},
		}})
	}

	total, err := h.service.UpdateOrderDetails(c.Context(), id, req)
	if err != nil {
		var verrs ValidationErrors
		if errors.As(err, &verrs) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": verrs})
		}
		if strings.Contains(err.Error(), "order not found") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "order not found"})
		}
		log.Printf("UpdateOrderDetails error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return c.JSON(UpdateDetailsResponse{ID: id, TotalAmount: total})
}

// CreateSpecialOrder handles POST /api/orders/special.
func (h *Handler) CreateSpecialOrder(c fiber.Ctx) error {
	var req CreateSpecialRequest
	if err := c.Bind().Body(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": []fiber.Map{
			{"field": "body", "message": "invalid request body"},
		}})
	}

	resp, err := h.service.CreateSpecial(c.Context(), req)
	if err != nil {
		var verrs ValidationErrors
		if errors.As(err, &verrs) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": verrs})
		}
		log.Printf("CreateSpecialOrder error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

// UploadAttachment handles POST /api/orders/:id/attachments.
func (h *Handler) UploadAttachment(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}

	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "no file provided"})
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "cannot open file"})
	}
	defer f.Close()

	fileURL, err := h.storageSvc.Upload(c.Context(), f, file.Filename, file.Size)
	if err != nil {
		if err == storage.ErrFileTooLarge {
			return c.Status(fiber.StatusRequestEntityTooLarge).JSON(fiber.Map{"error": err.Error()})
		}
		if err == storage.ErrInvalidFormat {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.service.AppendAttachment(c.Context(), id, fileURL); err != nil {
		if strings.Contains(err.Error(), "order not found") {
			// Best-effort cleanup of the just-uploaded orphan object.
			if fn, ferr := attachmentFilename(fileURL); ferr == nil {
				if derr := h.storageSvc.Delete(c.Context(), fn); derr != nil {
					log.Printf("orphan attachment cleanup failed: %v", derr)
				}
			}
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "order not found"})
		}
		log.Printf("UploadAttachment error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"url": fileURL})
}

// DeleteAttachment handles DELETE /api/orders/:id/attachments. The unlink is
// authoritative; the bucket hard-delete is best-effort (log-and-continue) so a
// missing object still succeeds (idempotent per spec).
func (h *Handler) DeleteAttachment(c fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "id is required"})
	}

	var req DeleteAttachmentRequest
	if err := c.Bind().Body(&req); err != nil || strings.TrimSpace(req.URL) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": []fiber.Map{
			{"field": "url", "message": "url is required"},
		}})
	}

	if err := h.service.RemoveAttachment(c.Context(), id, req.URL); err != nil {
		if strings.Contains(err.Error(), "order not found") {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "order not found"})
		}
		log.Printf("DeleteAttachment error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	if fn, ferr := attachmentFilename(req.URL); ferr == nil {
		if derr := h.storageSvc.Delete(c.Context(), fn); derr != nil {
			log.Printf("attachment bucket delete failed (ignored): %v", derr)
		}
	}

	return c.JSON(fiber.Map{"deleted": true})
}

// attachmentFilename extracts the bucket object name from a public URL.
func attachmentFilename(rawURL string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil || u.Path == "" {
		return "", fmt.Errorf("invalid attachment url")
	}
	return path.Base(u.Path), nil
}
