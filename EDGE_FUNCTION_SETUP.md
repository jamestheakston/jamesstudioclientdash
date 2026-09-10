# Edge Function Setup Guide

## Security Architecture for Client Dashboard

This Edge Function enables clients to edit their websites without exposing James Studio's GitHub credentials. The architecture:

- **James Studio's GitHub PAT**: Stored securely in Supabase environment variables
- **Client Access**: Clients only see repos they've been granted access to via the `access` table
- **Secure Proxy**: All GitHub API calls go through this Edge Function
- **No Client Credentials**: Clients never see or need their own GitHub tokens

This allows clients to edit their websites while James Studio maintains full control over the repositories.

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Link to Your Supabase Project

```bash
supabase link --project-ref pkqkqijmohbvfxxnzhyy
```

### 3. Set Environment Variables

Set your GitHub PAT as an environment variable:

```bash
supabase secrets set GITHUB_PAT=your_github_pat_here
```

### 4. Deploy the Edge Function

```bash
supabase functions deploy github-api
```

## Edge Function Details

The `github-api` Edge Function handles:

- **GET `/user/repos`**: Fetch user's GitHub repositories
- **GET `/repos/{owner}/{repo}/contents/{path}`**: Get file contents
- **PUT `/repos/{owner}/{repo}/contents/{path}`**: Update file contents

### Function Structure

```typescript
// Location: supabase/functions/github-api/index.ts
- Handles CORS headers
- Retrieves GitHub PAT from environment variable
- Proxies requests to GitHub API
- Returns GitHub API responses to client
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_PAT` | GitHub Personal Access Token | Yes |

## GitHub PAT Requirements

Your GitHub PAT needs the following scopes:
- `repo` (Full control of private repositories)
- `public_repo` (Access to public repositories)

## Usage in Client Code

```javascript
// Example: Fetch repositories
const { data, error } = await SupabaseClient.functions.invoke('github-api', {
  body: { 
    endpoint: '/user/repos',
    method: 'GET'
  }
});

// Example: Update file
const { data, error } = await SupabaseClient.functions.invoke('github-api', {
  body: { 
    endpoint: '/repos/owner/repo/contents/index.html',
    method: 'PUT',
    body: {
      message: 'Update content',
      content: base64EncodedContent,
      sha: currentFileSha
    }
  }
});
```

## Security Benefits

1. **Credential Protection**: PAT never exposed to client
2. **Centralized Control**: Easy to rotate credentials
3. **Rate Limiting**: Can implement rate limiting at Edge Function level
4. **Logging**: Server-side logging of API calls
5. **Access Control**: Can add additional auth checks if needed

## Troubleshooting

### Function Returns 500 Error
- Check that `GITHUB_PAT` environment variable is set
- Verify PAT has correct permissions
- Check Supabase logs: `supabase functions logs github-api`

### CORS Errors
- Ensure CORS headers are properly configured in Edge Function
- Check that your domain is allowed in Supabase settings

### GitHub API Rate Limits
- GitHub API has rate limits (5000 requests/hour for authenticated requests)
- Consider implementing caching if needed
- Monitor usage in GitHub developer settings

## Testing the Function

You can test the Edge Function locally:

```bash
supabase functions serve github-api
```

Then test with curl:

```bash
curl -X POST \
  http://localhost:54321/functions/v1/github-api \
  -H "Content-Type: application/json" \
  -d '{"endpoint": "/user/repos", "method": "GET"}'
```

## Monitoring

View function logs:

```bash
supabase functions logs github-api
```

Monitor function usage in Supabase dashboard under Edge Functions section.