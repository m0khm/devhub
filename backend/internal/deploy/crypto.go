package deploy

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
)

type Encryptor struct {
	gcm cipher.AEAD
}

func NewEncryptor(secret string) (*Encryptor, error) {
	if secret == "" {
		return nil, fmt.Errorf("empty encryption secret")
	}
	key := sha256.Sum256([]byte(secret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, fmt.Errorf("init cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("init gcm: %w", err)
	}
	return &Encryptor{gcm: gcm}, nil
}

func (e *Encryptor) Encrypt(plain []byte) (string, error) {
	nonce := make([]byte, e.gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}
	ciphertext := e.gcm.Seal(nil, nonce, plain, nil)
	payload := append(nonce, ciphertext...)
	return base64.StdEncoding.EncodeToString(payload), nil
}

func (e *Encryptor) Decrypt(encoded string) ([]byte, error) {
	payload, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("decode payload: %w", err)
	}
	nonceSize := e.gcm.NonceSize()
	if len(payload) < nonceSize {
		return nil, fmt.Errorf("payload too short")
	}
	nonce := payload[:nonceSize]
	ciphertext := payload[nonceSize:]
	plain, err := e.gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decrypt payload: %w", err)
	}
	return plain, nil
}
