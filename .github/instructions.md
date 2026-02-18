# Project Instructions

This file provides repository-specific guidance for contributors.

## Quick Links

- Project overview: README.md
- Quick start: QUICK_START.md
- Technical docs index: docs/README.md

## Development Basics

- Install dependencies: npm install
- Start dev server: npm run dev
- Build: npm run build

## Notes

- WebFOCUS REST API docs are in docs/01_REST_API_GUIDE.md.
- IBFS path guidance is in docs/02_IBFS_GUIDE.md.
- describeFex parameter handling is in docs/03_DESCRIBE_FEX_GUIDE.md.
- Best practices and Svelte patterns are in docs/04_BEST_PRACTICES.md and docs/05_SVELTE_PATTERNS.md.
- Troubleshooting is in docs/06_TROUBLESHOOTING.md.

## Investigation Tips

- REST API test page flow:
	1) Sign in: http://localhost/ibi_apps/rs?IBIRS_action=signOn&IBIRS_userName=admin&IBIRS_password=admin&IBIRS_service=ibfs
	2) Open test page: http://localhost/ibi_apps/rs?IBIRS_action=TEST
- If the user requests it, GitHub Copilot can launch Chrome via MCP tools and verify actual responses in the browser.

## Deployment Access

- After build and deploy to c:\ibi\apps\svelte, access the app at:
	http://localhost/approot/svelte/index.htm
- This access path avoids WebFOCUS CORS restrictions and is required when POST is needed.

## HTTP Method Policy

- Use GET when the action supports GET.
- signOn is normally POST, but this project uses GET.
- Per-action GET/POST is managed in src/api/webfocus.js via the ACTION_METHODS JSON map.

## WebFOCUS Security Notes

- Security tab (Admin Console) controls cross-origin behavior per zone.
- Cross-Origin Settings:
	- Allow Embedding (iframe)
	- Allow Cross-Origin Resources Sharing (CORS)
	- Allowed Origins whitelist (scheme/host/port required)
- Authentication Options:
	- Allowed Host Names whitelist for Host header validation
- Each Security Zone has its own configuration (Default/Mobile/Portlet/Alternate).

Reference: http://localhost/ibi_apps/ibi_help/Default.htm#securityAdmin/admin_console23.htm#Understa5
