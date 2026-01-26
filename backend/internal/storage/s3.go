package storage

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"path"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type S3Client struct {
	client        *minio.Client
	bucket        string
	endpoint      string
	useSSL        bool
	publicBaseURL *url.URL
}

func NewS3Client(endpoint, accessKey, secretKey, bucket string, useSSL bool, publicBaseURL string) (*S3Client, error) {
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create minio client: %w", err)
	}

	var parsedPublicBaseURL *url.URL
	if publicBaseURL != "" {
		parsedPublicBaseURL, err = url.Parse(publicBaseURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse S3 public base URL: %w", err)
		}
	}

	// Ensure bucket exists
	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket: %w", err)
	}

	if !exists {
		err = client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	return &S3Client{
		client:        client,
		bucket:        bucket,
		endpoint:      endpoint,
		useSSL:        useSSL,
		publicBaseURL: parsedPublicBaseURL,
	}, nil
}

type UploadResult struct {
	Key      string
	URL      string
	Size     int64
	MimeType string
}

func (s *S3Client) Upload(ctx context.Context, reader io.Reader, filename string, size int64, mimeType string) (*UploadResult, error) {
	// Generate unique key
	ext := filepath.Ext(filename)
	key := fmt.Sprintf("uploads/%s/%s%s", time.Now().Format("2006/01/02"), uuid.New().String(), ext)

	// Upload file
	_, err := s.client.PutObject(ctx, s.bucket, key, reader, size, minio.PutObjectOptions{
		ContentType: mimeType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Generate URL (assuming public bucket)
	url := s.buildObjectURL(key)

	return &UploadResult{
		Key:      key,
		URL:      url,
		Size:     size,
		MimeType: mimeType,
	}, nil
}

func (s *S3Client) Delete(ctx context.Context, key string) error {
	return s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
}

func (s *S3Client) GetURL(key string) string {
	return s.buildObjectURL(key)
}

func (s *S3Client) GetPresignedDownloadURL(ctx context.Context, key, filename, mimeType string) (string, error) {
	params := url.Values{}
	if filename != "" {
		params.Set("response-content-disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	}
	if mimeType != "" {
		params.Set("response-content-type", mimeType)
	}

	downloadURL, err := s.client.PresignedGetObject(ctx, s.bucket, key, time.Minute*15, params)
	if err != nil {
		return "", fmt.Errorf("failed to presign download url: %w", err)
	}

	return downloadURL.String(), nil
}

func (s *S3Client) IsReady() bool {
	return s != nil && s.client != nil && s.bucket != ""
}

func (s *S3Client) buildObjectURL(key string) string {
	if s.publicBaseURL != nil {
		base := *s.publicBaseURL
		base.Path = path.Join(base.Path, s.bucket, key)
		return base.String()
	}

	scheme := "http"
	if s.useSSL {
		scheme = "https"
	}

	return fmt.Sprintf("%s://%s/%s/%s", scheme, s.endpoint, s.bucket, key)
}
