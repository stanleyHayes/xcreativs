package db

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache provides a simple Redis-backed cache layer.
type Cache struct {
	client *redis.Client
	ttl    time.Duration
}

// NewCache creates a new Cache instance.
func NewCache(redisURL string) *Cache {
	if redisURL == "" {
		return nil
	}
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil
	}
	client := redis.NewClient(opt)
	return &Cache{client: client, ttl: 5 * time.Minute}
}

// Get retrieves a value from cache.
func (c *Cache) Get(ctx context.Context, key string, dest any) bool {
	if c == nil || c.client == nil {
		return false
	}
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		return false
	}
	if err := json.Unmarshal(data, dest); err != nil {
		return false
	}
	return true
}

// Set stores a value in cache.
func (c *Cache) Set(ctx context.Context, key string, value any) {
	if c == nil || c.client == nil {
		return
	}
	data, err := json.Marshal(value)
	if err != nil {
		return
	}
	c.client.Set(ctx, key, data, c.ttl)
}

// Delete removes a key from cache.
func (c *Cache) Delete(ctx context.Context, key string) {
	if c == nil || c.client == nil {
		return
	}
	c.client.Del(ctx, key)
}

// Health checks if Redis is reachable.
func (c *Cache) Health(ctx context.Context) error {
	if c == nil || c.client == nil {
		return fmt.Errorf("cache not configured")
	}
	return c.client.Ping(ctx).Err()
}

// globalCache is set at startup and used by repositories.
var globalCache *Cache

// SetGlobalCache sets the global cache instance.
func SetGlobalCache(c *Cache) {
	globalCache = c
}

// GetGlobalCache returns the global cache instance.
func GetGlobalCache() *Cache {
	return globalCache
}

// CacheKey generates a namespaced cache key.
func CacheKey(parts ...string) string {
	key := "xcreatives"
	for _, p := range parts {
		key += ":" + p
	}
	return key
}
