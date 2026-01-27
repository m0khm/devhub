package code

type Branch struct {
	Name       string `json:"name"`
	LastCommit string `json:"lastCommit"`
	UpdatedAt  string `json:"updatedAt"`
}

type Commit struct {
	Hash      string `json:"hash"`
	Message   string `json:"message"`
	Author    string `json:"author"`
	Timestamp string `json:"timestamp"`
}

type Change struct {
	ID        string   `json:"id"`
	Summary   string   `json:"summary"`
	Author    string   `json:"author"`
	Timestamp string   `json:"timestamp"`
	Files     []string `json:"files"`
}

type RepoActivity struct {
	Branches []Branch
	Commits  []Commit
	Changes  []Change
}
