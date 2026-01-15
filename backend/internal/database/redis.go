package database

import (
 "context"
 "fmt"
 "log"
 "time"

 "github.com/m0khm/devhub/backend/internal/config"
 "github.com/go-redis/redis/v8"
)

func ConnectRedis(cfg *config.RedisConfig) (*redis.Client, error) {
 client := redis.NewClient(&redis.Options{
  Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
  Password: cfg.Password,
  DB:       cfg.DB,
 })

 // Test connection with retry
 ctx := context.Background()
 maxRetries := 5
 
 var err error
 for i := 0; i < maxRetries; i++ {
  _, err = client.Ping(ctx).Result()
  if err == nil {
   break
  }
  
  log.Printf("Failed to connect to Redis (attempt %d/%d): %v", i+1, maxRetries, err)
  time.Sleep(time.Second * 2)
 }
 
 if err != nil {
  return nil, fmt.Errorf("failed to connect to Redis after %d attempts: %w", maxRetries, err)
 }

 log.Println("✅ Connected to Redis")
 return client, nil
}
