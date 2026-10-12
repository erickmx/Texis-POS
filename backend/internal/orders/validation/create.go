package validation

import (
	"fmt"
	"regexp"
	"strings"
)

const (
	// maxCustomerNameLength bounds the customer name on create.
	maxCustomerNameLength = 120
	// maxCreateTitleLength bounds the special request title on create.
	maxCreateTitleLength = 200
)

// attachmentURLPattern matches storage-bucket public URLs. Pattern-only check
// by design: a per-file bucket scan (Exists via ListFiles) is O(bucket).
var attachmentURLPattern = regexp.MustCompile(`^https?://[^/]+/storage/v1/object/public/inventory-images/[^/]+$`)

// ValidateCreateRequest validates the POST /api/orders/special payload.
// Pointer fields that are nil are skipped (server defaults apply).
func ValidateCreateRequest(customerName string, title *string, progressPct *int, gastoTerceros, serviceFee *float64, attachments []string) []FieldError {
	var errs []FieldError

	trimmed := strings.TrimSpace(customerName)
	if trimmed == "" {
		errs = append(errs, FieldError{Field: "customer_name", Message: "customer_name is required"})
	} else if len(trimmed) > maxCustomerNameLength {
		errs = append(errs, FieldError{Field: "customer_name", Message: fmt.Sprintf("customer_name must be <= %d characters, got %d", maxCustomerNameLength, len(trimmed))})
	}
	if title != nil && len(*title) > maxCreateTitleLength {
		errs = append(errs, FieldError{Field: "title", Message: fmt.Sprintf("title must be <= %d characters, got %d", maxCreateTitleLength, len(*title))})
	}
	if progressPct != nil && (*progressPct < 0 || *progressPct > 100) {
		errs = append(errs, FieldError{Field: "progress_pct", Message: fmt.Sprintf("progress_pct must be between 0 and 100, got %d", *progressPct)})
	}
	if gastoTerceros != nil && *gastoTerceros < 0 {
		errs = append(errs, FieldError{Field: "gasto_terceros", Message: fmt.Sprintf("gasto_terceros must be >= 0, got %v", *gastoTerceros)})
	}
	if serviceFee != nil && *serviceFee < 0 {
		errs = append(errs, FieldError{Field: "service_fee", Message: fmt.Sprintf("service_fee must be >= 0, got %v", *serviceFee)})
	}
	for _, a := range attachments {
		if !attachmentURLPattern.MatchString(a) {
			errs = append(errs, FieldError{Field: "attachments", Message: fmt.Sprintf("invalid attachment url: %s", a)})
			break
		}
	}
	return errs
}
