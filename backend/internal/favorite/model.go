package favorite

import (
	"time"

	"github.com/google/uuid"
)

type FavoriteTopic struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	ProjectID   uuid.UUID `json:"project_id"`
	FavoritedAt time.Time `json:"favorited_at"`
}

type FavoriteMessage struct {
	ID          uuid.UUID `json:"id"`
	Content     string    `json:"content"`
	TopicID     uuid.UUID `json:"topic_id"`
	TopicName   string    `json:"topic_name"`
	FavoritedAt time.Time `json:"favorited_at"`
}

type FavoritesResponse struct {
	Topics   []FavoriteTopic   `json:"topics"`
	Messages []FavoriteMessage `json:"messages"`
}
