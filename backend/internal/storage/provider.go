package storage

import (
	"context"
	"io"
)

type ImageStorageProvider interface {
	Upload(ctx context.Context, bucket string, filename string, reader io.Reader) (string, error)
	Exists(ctx context.Context, bucket string, filename string) (bool, error)
	GetPublicUrl(bucket string, filename string) string
}
