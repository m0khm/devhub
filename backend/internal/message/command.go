package message

import "strings"

type Command struct {
	Name string
	Args string
}

func ParseCommand(content string) (Command, bool) {
	trimmed := strings.TrimSpace(content)
	if !strings.HasPrefix(trimmed, "/") {
		return Command{}, false
	}

	parts := strings.Fields(trimmed)
	if len(parts) == 0 {
		return Command{}, false
	}

	name := strings.TrimPrefix(parts[0], "/")
	args := strings.TrimSpace(strings.TrimPrefix(trimmed, parts[0]))

	return Command{
		Name: strings.ToLower(name),
		Args: args,
	}, true
}
