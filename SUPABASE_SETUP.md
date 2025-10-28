# Supabase Integration Setup Guide

This guide will help you set up Supabase for the Sunny AI platform.

## Overview

Sunny AI uses Supabase as its production database. The application automatically detects whether Supabase is configured and falls back to demo mode (JSON file storage) if not.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed
3. The Sunny AI codebase

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: sunny-ai (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (⚙️) in the sidebar
2. Navigate to **API** section
3. You'll see two important values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Scroll down to **Service Role** section:
   - **service_role**: This is your `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 3: Configure Environment Variables

1. Open `.env.local` in your project root
2. Update the Supabase configuration with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Security Note**: Never commit `.env.local` to version control! The `.gitignore` file already excludes it.

## Step 4: Set Up the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** icon in the sidebar
2. Click **New Query**
3. Open the file `supabase/schema.sql` from your project
4. Copy the entire contents and paste it into the SQL Editor
5. Click **Run** to execute the schema

This will create all necessary tables, indexes, Row Level Security (RLS) policies, and triggers.

## Step 5: Verify the Setup

### Check Tables

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `users`
   - `student_profiles`
   - `chat_messages`
   - `focus_sessions`
   - `concept_memories`
   - `lesson_plans`
   - `game_sessions`

### Check RLS Policies

1. Click on any table in the Table Editor
2. Click the **Policies** tab
3. Verify that RLS is enabled and policies are in place

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Check the console for Supabase connection status:
   - You should see "✅ Supabase configured" in the demo mode logs
   - No errors about database connections

3. Try creating a user account and verify it appears in Supabase:
   - Go to **Table Editor** > **users** in Supabase
   - You should see the new user record

## Database Schema Overview

### Core Tables

#### `users`
Stores user profiles, authentication, and learning data.
- Primary key: `id` (text)
- Unique: `email`
- Includes: learning preferences, progress tracking, chat history

#### `student_profiles`
Enhanced student profiles for the multi-agent learning system.
- Links to `users` via `user_id`
- Tracks: knowledge, emotions, learning velocity, cognitive profile

#### `chat_messages`
Individual chat messages for better querying and analytics.
- Links to both `users` and `student_profiles`
- Supports different message types: chat, challenge, feedback

#### `focus_sessions`
20-minute adaptive learning session summaries.
- Stores concept maps, learning loops, performance metrics
- Status tracking: active, completed, abandoned

#### `concept_memories`
Long-term concept mastery and spaced repetition data.
- Implements spaced repetition algorithm
- Tracks mastery levels, practice history, next review dates

#### `lesson_plans`
Teacher-created custom lesson plans.
- Supports sample lessons (public) and custom lessons (private)
- Full-text search on tags and keywords

#### `game_sessions`
Tracks game performance and progress.
- Stores scores, duration, completion status
- Flexible metrics storage via JSONB

## Row Level Security (RLS)

All tables have RLS enabled to ensure data privacy:

- **Users**: Can only access their own data
- **Student Profiles**: Can only access their own profile
- **Chat Messages**: Can only access their own messages
- **Focus Sessions**: Can only access sessions linked to their profile
- **Concept Memories**: Can only access their own memories
- **Lesson Plans**: Sample lessons are public, custom lessons visible to creator only
- **Game Sessions**: Can only access their own sessions

## Demo Mode vs Production Mode

### Demo Mode (No Supabase)
- Uses JSON file storage (`src/data/db/users.json`)
- Perfect for development and testing
- No database setup required
- Data persists locally

### Production Mode (With Supabase)
- Uses Supabase PostgreSQL database
- Scalable and production-ready
- Real-time capabilities available
- Automatic backups and point-in-time recovery

### Automatic Fallback
The application automatically detects Supabase availability:
1. Checks for environment variables
2. If Supabase is configured → uses Supabase
3. If Supabase is not configured → uses demo mode
4. If Supabase fails → falls back to demo mode with warning

## Troubleshooting

### "Supabase admin client not available"
- Check that all three environment variables are set in `.env.local`
- Verify the values are correct (no extra spaces or quotes)
- Restart your development server after changing `.env.local`

### "Error fetching users from Supabase"
- Verify the database schema was applied correctly
- Check RLS policies are in place
- Ensure your service role key has admin privileges

### "PGRST116" Error (No rows returned)
- This is normal when querying for a non-existent record
- The code handles this gracefully and returns `null`

### Connection Timeout
- Check your internet connection
- Verify the Supabase project is running (not paused)
- Check if your IP is blocked by Supabase firewall settings

## Advanced Configuration

### Custom Database URL
If you're using a custom domain or connection pooling:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-custom-domain.com
```

### Connection Pooling
For high-traffic applications, consider using Supabase's connection pooling:
1. Go to **Settings** > **Database** in Supabase
2. Copy the **Connection Pooling** URL
3. Use it for server-side operations

### Backups
Supabase automatically backs up your database:
- Point-in-time recovery available for Pro plans
- Manual backups can be created in **Database** > **Backups**

## Migration from Demo Mode

If you've been using demo mode and want to migrate to Supabase:

1. Export your current data:
   ```bash
   cp src/data/db/users.json backup-users.json
   ```

2. Set up Supabase following this guide

3. Create a migration script to import the JSON data into Supabase

4. Verify the data migrated correctly

5. Update your environment variables to use Supabase

## Security Best Practices

1. **Never commit secrets**: Keep `.env.local` out of version control
2. **Use service role key carefully**: Only use it in server-side code
3. **Enable RLS**: Always keep Row Level Security enabled
4. **Regular backups**: Set up automated backup schedules
5. **Monitor usage**: Check Supabase dashboard for unusual activity
6. **Rotate keys**: Periodically rotate your API keys

## Next Steps

- Set up Supabase Auth for user authentication
- Configure real-time subscriptions for live updates
- Set up storage buckets for user-generated content
- Enable Edge Functions for serverless operations

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Sunny AI Issues**: [Your GitHub Issues URL]
- **Community**: [Your Discord/Slack URL]

---

**Last Updated**: October 2025
**Supabase Version**: Latest
**Sunny AI Version**: 1.0.0
