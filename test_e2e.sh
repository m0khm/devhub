set -euo pipefail

BASE="http://localhost:8080"

echo "== Health =="
curl -s "$BASE/health" | jq .

echo "== Login =="
TOKEN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@devhub.com","password":"password123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Login failed. Response:"
  curl -s -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@devhub.com","password":"password123"}' | jq .
  exit 1
fi
echo "Token OK"

echo "== Create project =="
PROJECT=$(curl -s -X POST "$BASE/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"My project"}')

echo "$PROJECT" | jq .
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "Project create failed"
  exit 1
fi
echo "Project ID: $PROJECT_ID"

echo "== Create topic =="
TOPIC=$(curl -s -X POST "$BASE/api/projects/$PROJECT_ID/topics" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"General","type":"chat","icon":"💬"}')

echo "$TOPIC" | jq .
TOPIC_ID=$(echo "$TOPIC" | jq -r '.id')
if [ -z "$TOPIC_ID" ] || [ "$TOPIC_ID" = "null" ]; then
  echo "Topic create failed"
  exit 1
fi
echo "Topic ID: $TOPIC_ID"

echo "== Create message =="
MESSAGE=$(curl -s -X POST "$BASE/api/topics/$TOPIC_ID/messages" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello World!","type":"text"}')

echo "$MESSAGE" | jq .
MESSAGE_ID=$(echo "$MESSAGE" | jq -r '.id')
if [ -z "$MESSAGE_ID" ] || [ "$MESSAGE_ID" = "null" ]; then
  echo "Message create failed"
  exit 1
fi
echo "Message ID: $MESSAGE_ID"

echo "== Get messages =="
curl -s "$BASE/api/topics/$TOPIC_ID/messages" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo "== Add reaction =="
curl -s -X POST "$BASE/api/messages/$MESSAGE_ID/reactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}' | jq .

echo "DONE ✅"
