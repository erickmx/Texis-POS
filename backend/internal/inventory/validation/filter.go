package validation

import (
	"fmt"
	"strconv"
	"strings"
)

type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

var AllowedProductSortColumns = []string{"title", "sale_price", "stock_level", "created_at"}

type ProductFilter struct {
	Page      int
	Limit     int
	Search    string
	SortBy    string
	SortOrder string
}

func ParseProductFilter(values map[string]string) ProductFilter {
	f := ProductFilter{
		Page:      1,
		Limit:     20,
		SortBy:    "created_at",
		SortOrder: "desc",
	}
	if p, ok := values["page"]; ok {
		if n, err := strconv.Atoi(p); err == nil {
			f.Page = n
		}
	}
	if l, ok := values["limit"]; ok {
		if n, err := strconv.Atoi(l); err == nil {
			f.Limit = n
		}
	}
	if s, ok := values["search"]; ok {
		f.Search = strings.TrimSpace(s)
	}
	if s, ok := values["sort_by"]; ok {
		f.SortBy = strings.TrimSpace(s)
	}
	if s, ok := values["sort_order"]; ok {
		f.SortOrder = strings.ToLower(strings.TrimSpace(s))
	}
	return f
}

func (f ProductFilter) Validate() []FieldError {
	var errs []FieldError
	if f.Page < 1 {
		errs = append(errs, FieldError{Field: "page", Message: fmt.Sprintf("page must be >= 1, got %d", f.Page)})
	}
	if f.Limit < 1 || f.Limit > 100 {
		errs = append(errs, FieldError{Field: "limit", Message: fmt.Sprintf("limit must be between 1 and 100, got %d", f.Limit)})
	}
	if len(f.Search) > 200 {
		errs = append(errs, FieldError{Field: "search", Message: fmt.Sprintf("search must be <= 200 characters, got %d", len(f.Search))})
	}
	if !isInSlice(f.SortBy, AllowedProductSortColumns) {
		errs = append(errs, FieldError{Field: "sort_by", Message: fmt.Sprintf("invalid sort_by: %s. Allowed: %s", f.SortBy, strings.Join(AllowedProductSortColumns, ", "))})
	}
	if f.SortOrder != "asc" && f.SortOrder != "desc" {
		errs = append(errs, FieldError{Field: "sort_order", Message: fmt.Sprintf("invalid sort_order: %s. Allowed: asc, desc", f.SortOrder)})
	}
	return errs
}

func isInSlice(val string, allowed []string) bool {
	for _, a := range allowed {
		if val == a {
			return true
		}
	}
	return false
}
