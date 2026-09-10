# Supabase Setup Guide

## Use Case: Client Dashboard for James Studio Projects

This dashboard is designed for clients who need to access and edit websites that James Studio has created for them. 

**How it works:**
- James Studio owns the GitHub repositories
- Clients are granted access to specific repos via the `access` table
- All GitHub operations use James Studio's PAT (stored securely in Edge Function)
- Clients can only see/edit repos they've been granted permission to access
- Clients never see James Studio's GitHub credentials

## Authentication Setup

### Enable Email Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure email settings (optional):
   - Enable email confirmation (recommended for production)
   - Customize email templates
   - Set up SMTP if needed

### Authentication Settings

In **Authentication** → **Settings**:
- **Site URL**: Your dashboard URL (e.g., `https://yourdomain.com`)
- **Redirect URLs**: Add your dashboard URL to allowed redirects

### User Management

Account management is handled by James Studio:
- No public sign-up available
- James Studio creates accounts manually for clients
- Clients can sign in with provided credentials
- Password reset handled by James Studio (clients must contact you)
- Session persistence (handled by Supabase)

## Access Control Table

Create a table called `access` in your Supabase project to manage which users have access to which repositories.

### Table Structure

```sql
CREATE TABLE access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_access_email ON access(email);
CREATE INDEX idx_access_repo_name ON access(repo_name);

-- Enable Row Level Security (optional, if you want additional security)
ALTER TABLE access ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reads (adjust based on your security needs)
CREATE POLICY "Allow read access" ON access FOR SELECT USING (true);
```

### Sample Data

```sql
-- Insert sample access records (use just repo name, not full path)
INSERT INTO access (email, repo_name) VALUES
    ('client@example.com', 'classcharts-improver'),
    ('client@example.com', 'scouts-car-wash'),
    ('another-client@example.com', 'montecure-dogs');
```

### How It Works for Client Access

1. **James Studio Setup**: You add entries to the `access` table mapping client emails to specific repository names (just the repo name, not full path)
2. **Client Login**: Client signs up/logs in with their email
3. **Access Check**: System queries the `access` table for repos assigned to that client's email
4. **GitHub Operations**: All GitHub API calls use James Studio's PAT (via Edge Function)
5. **Repo Filtering**: Client only sees repos they've been granted access to
6. **Editing**: Client can edit content using the visual editor
7. **Saving**: Changes are committed to the repository using James Studio's credentials

### Example Scenario

**James Studio has 3 clients:**
- Client A (alice@example.com) → Access to `alice-website`
- Client B (bob@example.com) → Access to `bob-website` 
- Client C (charlie@example.com) → Access to both `alice-website` and `bob-website`

**Access table entries:**
```sql
INSERT INTO access (email, repo_name) VALUES
    ('alice@example.com', 'alice-website'),
    ('bob@example.com', 'bob-website'),
    ('charlie@example.com', 'alice-website'),
    ('charlie@example.com', 'bob-website');
```

**Result:**
- Alice only sees alice-website
- Bob only sees bob-website  
- Charlie sees both websites

### Usage Notes

- `repo_name` should be just the repository name (e.g., `alice-website`), not the full path
- The system automatically prepends the owner when making GitHub API calls
- Multiple access records can exist for the same email (user can access multiple repos)
- The same repo can be assigned to multiple users

### Account Creation for Clients

Since there's no public sign-up, James Studio creates client accounts manually:

1. **Via Supabase Dashboard**: Go to Authentication → Users → Add user
2. **Via SQL**: Insert directly into auth.users table
3. **Assign password**: Choose a secure password
4. **Share credentials**: Provide email and password to client securely

### Password Management

- Clients must contact James Studio for password resets
- James Studio can reset passwords via Supabase Dashboard
- No self-service password reset available

### Admin Management

To manage access, you can:

1. **Via Supabase Dashboard**: Go to Table Editor → access table → Insert row
2. **Via SQL**: Use the INSERT statements above
3. **Via API**: Create an admin interface (future enhancement)

### Security Considerations

- Currently uses the anon key for Supabase operations
- Consider implementing Row Level Security policies for production
- You may want to add an `is_active` boolean column for easy access revocation
- Consider adding `role` column for different permission levels (read-only, editor, admin)