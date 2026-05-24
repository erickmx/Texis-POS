package inventory

import (
	"time"

	"github.com/erickmx/texis-pos/internal/category"
)

type Product struct {
	ID           string              `json:"id" db:"id"`
	Title        string              `json:"title" db:"title"`
	Description  string              `json:"description" db:"description"`
	SKU          string              `json:"sku" db:"sku"`
	ClaveSAT     string              `json:"clave_sat" db:"clave_sat"`
	UnitSAT      string              `json:"unit_sat" db:"unit_sat"`
	BuyPrice     float64             `json:"buy_price" db:"buy_price"`
	SalePrice    float64             `json:"sale_price" db:"sale_price"`
	StockLevel   int                 `json:"stock_level" db:"stock_level"`
	ReorderPoint int                 `json:"reorder_point" db:"reorder_point"`
	ImageURL     string              `json:"image_url" db:"image_url"`
	IsDeleted    bool                `json:"is_deleted" db:"is_deleted"`
	CreatedAt    time.Time           `json:"created_at" db:"created_at"`
	Categories   []category.Category `json:"categories,omitempty"`
}

type CreateProductDTO struct {
	Title        string   `json:"title" validate:"required"`
	Description  string   `json:"description,omitempty"`
	SKU          string   `json:"sku,omitempty"`
	ClaveSAT     string   `json:"clave_sat" validate:"required"`
	UnitSAT      string   `json:"unit_sat,omitempty" default:"H87"`
	BuyPrice     float64  `json:"buy_price" validate:"required"`
	SalePrice    float64  `json:"sale_price" validate:"required"`
	StockLevel   int      `json:"stock_level"`
	ReorderPoint int      `json:"reorder_point"`
	ImageURL     string   `json:"image_url,omitempty"`
	CategoryIDs  []string `json:"category_ids,omitempty"`
}

type UpdateProductDTO struct {
	Title        *string  `json:"title"`
	Description  *string  `json:"description"`
	SKU          *string  `json:"sku"`
	ClaveSAT     *string  `json:"clave_sat"`
	UnitSAT      *string  `json:"unit_sat"`
	BuyPrice     *float64 `json:"buy_price"`
	SalePrice    *float64 `json:"sale_price"`
	StockLevel   *int     `json:"stock_level"`
	ReorderPoint *int     `json:"reorder_point"`
	ImageURL     *string  `json:"image_url"`
	CategoryIDs  []string `json:"category_ids,omitempty"`
}

type PaginationMeta struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type ProductListResponse struct {
	Data []Product      `json:"data"`
	Meta PaginationMeta `json:"meta"`
}
