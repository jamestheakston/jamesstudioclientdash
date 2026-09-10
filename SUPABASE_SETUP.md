# Supabase Setup Guide

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
-- Insert sample access records
INSERT INTO access (email, repo_name) VALUES
    ('client@example.com', 'jamestheakston/classcharts-improver'),
    ('client@example.com', 'jamestheakston/scouts-car-wash'),
    ('another-client@example.com', 'jamestheakston/montecure-dogs');
```

### How It Works

1. When a user logs in, the dashboard fetches their email from the authentication
2. The system queries the `access` table for all `repo_name` values associated with that email
3. When fetching GitHub repositories, the system filters to show only repos that match the user's access list
4. If the access table is empty or the user has no access records, they will see no repositories (in production mode)

### Usage Notes

- `repo_name` can be either the full repository name (e.g., `owner/repo`) or just the repo name
- The system checks for both formats when filtering
- Multiple access records can exist for the same email (user can access multiple repos)
- The same repo can be assigned to multiple users

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