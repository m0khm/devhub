package metrics

import (
	"fmt"
	"sort"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gofiber/fiber/v2"
)

type labelKey struct {
	Method string
	Path   string
	Status string
}

type durationSummary struct {
	Count uint64
	Sum   float64
}

type store struct {
	mu        sync.Mutex
	requests  map[labelKey]uint64
	errors    map[labelKey]uint64
	durations map[labelKey]durationSummary
}

var metricsStore = store{
	requests:  make(map[labelKey]uint64),
	errors:    make(map[labelKey]uint64),
	durations: make(map[labelKey]durationSummary),
}

var wsConnections int64

func Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()

		status := c.Response().StatusCode()
		route := c.Path()
		if c.Route() != nil && c.Route().Path != "" {
			route = c.Route().Path
		}

		key := labelKey{
			Method: c.Method(),
			Path:   route,
			Status: fmt.Sprintf("%d", status),
		}

		metricsStore.mu.Lock()
		metricsStore.requests[key]++
		if status >= fiber.StatusBadRequest {
			metricsStore.errors[key]++
		}
		duration := time.Since(start).Seconds()
		summary := metricsStore.durations[key]
		summary.Count++
		summary.Sum += duration
		metricsStore.durations[key] = summary
		metricsStore.mu.Unlock()

		return err
	}
}

func WebsocketConnected() {
	atomic.AddInt64(&wsConnections, 1)
}

func WebsocketDisconnected() {
	atomic.AddInt64(&wsConnections, -1)
}

func Handler(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/plain; version=0.0.4")

	var builder strings.Builder
	builder.WriteString("# HELP devhub_http_requests_total Total number of HTTP requests handled by the API.\n")
	builder.WriteString("# TYPE devhub_http_requests_total counter\n")

	metricsStore.mu.Lock()
	keys := sortedKeys(metricsStore.requests)
	for _, key := range keys {
		builder.WriteString(formatCounterLine("devhub_http_requests_total", key, metricsStore.requests[key]))
	}

	builder.WriteString("# HELP devhub_http_errors_total Total number of HTTP error responses (status >= 400).\n")
	builder.WriteString("# TYPE devhub_http_errors_total counter\n")
	errorKeys := sortedKeys(metricsStore.errors)
	for _, key := range errorKeys {
		builder.WriteString(formatCounterLine("devhub_http_errors_total", key, metricsStore.errors[key]))
	}

	builder.WriteString("# HELP devhub_http_request_duration_seconds Duration of HTTP requests handled by the API.\n")
	builder.WriteString("# TYPE devhub_http_request_duration_seconds summary\n")
	durationKeys := sortedKeys(metricsStore.durations)
	for _, key := range durationKeys {
		summary := metricsStore.durations[key]
		builder.WriteString(formatSummaryLine("devhub_http_request_duration_seconds", key, summary))
	}
	metricsStore.mu.Unlock()

	builder.WriteString("# HELP devhub_ws_connections Number of active WebSocket connections.\n")
	builder.WriteString("# TYPE devhub_ws_connections gauge\n")
	builder.WriteString(fmt.Sprintf("devhub_ws_connections %d\n", atomic.LoadInt64(&wsConnections)))

	return c.SendString(builder.String())
}

func sortedKeys[T any](input map[labelKey]T) []labelKey {
	keys := make([]labelKey, 0, len(input))
	for key := range input {
		keys = append(keys, key)
	}
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].Path == keys[j].Path {
			if keys[i].Method == keys[j].Method {
				return keys[i].Status < keys[j].Status
			}
			return keys[i].Method < keys[j].Method
		}
		return keys[i].Path < keys[j].Path
	})
	return keys
}

func formatCounterLine(name string, key labelKey, value uint64) string {
	return fmt.Sprintf("%s{method=%q,path=%q,status=%q} %d\n", name, escapeLabelValue(key.Method), escapeLabelValue(key.Path), escapeLabelValue(key.Status), value)
}

func formatSummaryLine(name string, key labelKey, summary durationSummary) string {
	labels := fmt.Sprintf("{method=%q,path=%q,status=%q}", escapeLabelValue(key.Method), escapeLabelValue(key.Path), escapeLabelValue(key.Status))
	return fmt.Sprintf("%s_sum%s %.6f\n%s_count%s %d\n", name, labels, summary.Sum, name, labels, summary.Count)
}

func escapeLabelValue(value string) string {
	replacer := strings.NewReplacer("\\", "\\\\", "\n", "\\n", "\"", "\\\"")
	return replacer.Replace(value)
}
