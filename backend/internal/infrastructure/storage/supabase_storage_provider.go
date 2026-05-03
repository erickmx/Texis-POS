package storage

import (
	"bytes"
	"context"
	"io"

	"github.com/supabase-community/storage-go"
	"github.com/supabase-community/supabase-go"
)

type SupabaseStorageProvider struct {
	client *supabase.Client
}

func NewSupabaseStorageProvider(client *supabase.Client) *SupabaseStorageProvider {
	return &SupabaseStorageProvider{client: client}
}

func (p *SupabaseStorageProvider) Upload(ctx context.Context, bucket string, filename string, reader io.Reader) (string, error) {
	body, err := io.ReadAll(reader)
	if err != nil {
		return "", err
	}

	_, err = p.client.Storage.UploadFile(bucket, filename, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	publicURL := p.client.Storage.GetPublicUrl(bucket, filename)
	return publicURL.SignedURL, nil
}

func (p *SupabaseStorageProvider) Exists(ctx context.Context, bucket string, filename string) (bool, error) {
	files, err := p.client.Storage.ListFiles(bucket, "", storage_go.FileSearchOptions{})
	if err != nil {
		return false, err
	}

	for _, f := range files {
		if f.Name == filename {
			return true, nil
		}
	}

	return false, nil
}

func (p *SupabaseStorageProvider) GetPublicUrl(bucket string, filename string) string {
	publicURL := p.client.Storage.GetPublicUrl(bucket, filename)
	return publicURL.SignedURL
}
