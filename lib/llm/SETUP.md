# ROOTED Suggestion Agent Setup Guide

This guide walks you through setting up the LangChain-powered suggestion agent for the ROOTED Companion App.

## Prerequisites

- ✅ Supabase project with the required tables
- ✅ OpenAI API account and API key  
- ✅ Next.js project with App Router
- ✅ LangChain packages installed

## Environment Variables

Add these to your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema Verification

Ensure these tables exist in your Supabase database:

### wearable_data
```sql
id: uuid (primary key)
connection_id: uuid (foreign key to wearable_connections)
metric_type: varchar (hrv_rmssd, heart_rate_resting, sleep_total, stress_avg)
value: numeric
unit: varchar
timestamp: timestamptz
source: varchar
created_at: timestamptz
```

### wearable_connections
```sql
id: uuid (primary key)
user_id: uuid (foreign key to auth.users)
wearable_type: varchar
wearable_user_id: text
access_token: text
-- ... other connection fields
```

### suggestion_logs
```sql
id: uuid (primary key)
user_id: uuid (foreign key to auth.users)
recovery_score: numeric
wearable_data: jsonb
subjective_input: jsonb
suggestion: jsonb
completed: boolean (default false)
created_at: timestamptz
```

### mood_reflections
```sql
id: uuid (primary key)
user_id: uuid (foreign key to auth.users)
suggestion_id: uuid (foreign key to suggestion_logs)
mood_emoji: text
mood_text: text
created_at: timestamptz
```

## Installation Steps

### 1. Install Required Packages

```bash
npm install @langchain/openai @langchain/core langchain
```

### 2. Verify Files Are in Place

Check that these files exist:
- `lib/llm/suggestionAgent.ts` - Main agent implementation
- `app/api/suggestions/daily/route.ts` - API endpoint for daily suggestions
- `app/api/suggestions/complete/route.ts` - API endpoint for marking completions

### 3. Test the Installation

Create a test file to verify everything works:

```typescript
// test-suggestion-agent.ts
import { generateDailySuggestion } from './lib/llm/suggestionAgent';

async function testSuggestionAgent() {
  try {
    // Replace with a real user ID from your auth.users table
    const testUserId = 'your-test-user-id-here';
    
    console.log('Testing suggestion agent...');
    const suggestion = await generateDailySuggestion(testUserId);
    
    console.log('✅ Success! Generated suggestion:', suggestion);
  } catch (error) {
    console.error('❌ Error testing suggestion agent:', error);
  }
}

testSuggestionAgent();
```

### 4. API Endpoint Testing

Test the API endpoints using curl or your API client:

```bash
# Test generating a daily suggestion (requires authentication)
curl -X POST http://localhost:3000/api/suggestions/daily \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token"

# Test getting completion stats
curl -X GET http://localhost:3000/api/suggestions/complete \
  -H "Authorization: Bearer your-auth-token"

# Test marking a suggestion as complete
curl -X POST http://localhost:3000/api/suggestions/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-auth-token" \
  -d '{"suggestionId": "your-suggestion-id"}'
```

## Frontend Integration

### Option 1: Using the API Routes

```typescript
// In your React component
const generateSuggestion = async () => {
  const response = await fetch('/api/suggestions/daily', {
    method: 'POST',
  });
  
  if (response.ok) {
    const data = await response.json();
    return data.suggestion;
  }
  throw new Error('Failed to generate suggestion');
};
```

### Option 2: Server Actions (Recommended)

```typescript
// app/actions/suggestions.ts
'use server';

import { generateDailySuggestion } from '@/lib/llm/suggestionAgent';
import { createClient } from '@/utils/supabase/server';

export async function getDailySuggestion() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return await generateDailySuggestion(user.id);
}
```

Then in your component:
```typescript
import { getDailySuggestion } from '@/app/actions/suggestions';

// In your component
const suggestion = await getDailySuggestion();
```

## Error Handling & Fallbacks

The suggestion agent is designed with robust error handling:

1. **No biometric data**: Returns a breathwork fallback suggestion
2. **OpenAI API failure**: Returns a generic movement suggestion
3. **Database errors**: Logs errors but continues with fallbacks
4. **JSON parsing errors**: Returns a formatted fallback suggestion

## Performance Considerations

- **Caching**: Consider caching daily suggestions to avoid regenerating them
- **Rate limiting**: Implement rate limiting on API endpoints
- **Background jobs**: Consider generating suggestions in background jobs
- **Database indexing**: Ensure proper indexes on timestamp and user_id fields

## Monitoring & Logging

The agent logs important events to help with debugging:

```typescript
// Example log messages you'll see
console.log(`No biometric data found for user ${userId}, using fallback suggestion`);
console.error('Error loading biometric data:', error);
console.error('Error parsing LLM response:', parseError);
```

Consider setting up proper logging and monitoring in production.

## Security Considerations

- ✅ All database queries use the admin client with proper RLS
- ✅ API endpoints validate user authentication
- ✅ User can only access their own suggestions
- ✅ OpenAI API key is stored securely in environment variables
- ✅ No user data is sent to OpenAI that could identify them

## Troubleshooting

### Common Issues

1. **"OpenAI API key not found"**
   - Check that `OPENAI_API_KEY` is set in `.env.local`
   - Ensure the API key is valid and has credits

2. **"No biometric data found"**
   - Check that wearable data exists for the user
   - Verify the `wearable_connections` table links correctly

3. **"Unauthorized" errors**
   - Ensure user is authenticated
   - Check Supabase RLS policies
   - Verify service role key is correct

4. **JSON parsing errors**
   - Usually means OpenAI returned unexpected format
   - Check the system prompt and model configuration
   - Fallback suggestion will be used automatically

### Debug Mode

To enable verbose logging, add this to your environment:

```bash
DEBUG=true
```

## Next Steps

Once the suggestion agent is working:

1. **Add to Dashboard**: Integrate with your main dashboard
2. **Scheduling**: Set up daily suggestion generation
3. **Notifications**: Add push notifications for daily suggestions
4. **Analytics**: Track completion rates and user engagement
5. **Personalization**: Enhance with user preferences and history

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set
3. Test with a simple user that has biometric data
4. Check the database schema matches the expected format

The suggestion agent is designed to fail gracefully, so users should always receive some form of suggestion even if there are technical issues.