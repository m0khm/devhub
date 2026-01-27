package code

var repoActivityData = map[string]RepoActivity{
	"alpha": {
		Branches: []Branch{
			{Name: "main", LastCommit: "9bf2c21", UpdatedAt: "2 hours ago"},
			{Name: "design/refresh", LastCommit: "0f4ad20", UpdatedAt: "yesterday"},
			{Name: "feat/notifications", LastCommit: "ad129fe", UpdatedAt: "2 days ago"},
			{Name: "chore/cleanup", LastCommit: "c018ef2", UpdatedAt: "last week"},
		},
		Commits: []Commit{
			{
				Hash:      "9bf2c21",
				Message:   "Polish header spacing + restore theme tokens",
				Author:    "Maya Chen",
				Timestamp: "Today · 12:45",
			},
			{
				Hash:      "0f4ad20",
				Message:   "Add onboarding hints for new repos",
				Author:    "Devon Lee",
				Timestamp: "Yesterday · 16:10",
			},
			{
				Hash:      "ad129fe",
				Message:   "Refactor build pipeline for UI bundles",
				Author:    "Ira Diaz",
				Timestamp: "Mon · 09:02",
			},
		},
		Changes: []Change{
			{
				ID:        "change-1",
				Summary:   "Updated sidebar navigation layout",
				Author:    "Maya Chen",
				Timestamp: "Today · 11:30",
				Files:     []string{"src/components/Sidebar.tsx", "src/styles/sidebar.css"},
			},
			{
				ID:        "change-2",
				Summary:   "Refined color tokens for dark mode",
				Author:    "Devon Lee",
				Timestamp: "Yesterday · 15:42",
				Files:     []string{"src/styles/theme.css"},
			},
			{
				ID:        "change-3",
				Summary:   "Improved lint rules and formatting",
				Author:    "Ira Diaz",
				Timestamp: "Mon · 08:15",
				Files:     []string{".eslintrc", "package.json"},
			},
		},
	},
	"beta": {
		Branches: []Branch{
			{Name: "main", LastCommit: "a70f343", UpdatedAt: "yesterday"},
			{Name: "feat/billing-api", LastCommit: "d11c3ad", UpdatedAt: "3 days ago"},
			{Name: "ops/metrics", LastCommit: "bb67e12", UpdatedAt: "last week"},
		},
		Commits: []Commit{
			{
				Hash:      "a70f343",
				Message:   "Add request tracing to API gateway",
				Author:    "Felix Park",
				Timestamp: "Yesterday · 18:03",
			},
			{
				Hash:      "d11c3ad",
				Message:   "Introduce billing endpoints",
				Author:    "Rosa Miles",
				Timestamp: "Mon · 10:27",
			},
			{
				Hash:      "bb67e12",
				Message:   "Tune worker concurrency defaults",
				Author:    "Felix Park",
				Timestamp: "Fri · 17:50",
			},
		},
		Changes: []Change{
			{
				ID:        "change-4",
				Summary:   "Migrated database connection pool",
				Author:    "Rosa Miles",
				Timestamp: "Yesterday · 13:20",
				Files:     []string{"cmd/api/main.go", "config/database.yml"},
			},
			{
				ID:        "change-5",
				Summary:   "Added health checks for workers",
				Author:    "Felix Park",
				Timestamp: "Mon · 11:04",
				Files:     []string{"internal/health/handler.go"},
			},
		},
	},
	"default": {
		Branches: []Branch{
			{Name: "main", LastCommit: "f1a3c2d", UpdatedAt: "recently"},
		},
		Commits: []Commit{
			{
				Hash:      "f1a3c2d",
				Message:   "Initial import",
				Author:    "DevHub",
				Timestamp: "Recently",
			},
		},
		Changes: []Change{
			{
				ID:        "change-default",
				Summary:   "Repository initialized",
				Author:    "DevHub",
				Timestamp: "Recently",
				Files:     []string{"README.md"},
			},
		},
	},
}
