package db

import (
	"context"
	"testing"

	"github.com/erickmx/texis-pos/internal/orders/validation"
	"github.com/erickmx/texis-pos/pkg/supabase"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSupabaseOrderRepository_List(t *testing.T) {
	skipIfNoSupabase(t)
	require.NoError(t, supabase.Init())
	repo := NewSupabaseOrderRepository(supabase.GetClient())
	ctx := context.Background()

	filter := validation.OrderFilter{
		Page:      1,
		Limit:     5,
		SortBy:    "created_at",
		SortOrder: "desc",
	}
	ordersList, count, err := repo.List(ctx, filter)
	assert.NoError(t, err)
	assert.NotNil(t, ordersList)
	assert.GreaterOrEqual(t, count, int64(0))
}
