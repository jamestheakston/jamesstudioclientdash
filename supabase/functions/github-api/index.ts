import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const { endpoint, method = 'GET', body: requestBodyData } = requestBody
    
    // Get James Studio's GitHub PAT from environment variable
    // This allows clients to edit their sites without needing their own GitHub credentials
    const githubPat = Deno.env.get('GITHUB_PAT')
    
    if (!githubPat) {
      return new Response(
        JSON.stringify({ error: 'GitHub PAT not configured - contact James Studio' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Construct GitHub API URL
    const githubUrl = `https://api.github.com${endpoint}`

    // Make request to GitHub API using James Studio's credentials
    const githubHeaders = {
      'Authorization': `token ${githubPat}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'James-Studio-Client-Dashboard',
      'Content-Type': 'application/json'
    }

    const githubResponse = await fetch(githubUrl, {
      method: method,
      headers: githubHeaders,
      body: requestBodyData ? JSON.stringify(requestBodyData) : undefined
    })

    const githubData = await githubResponse.json()

    if (!githubResponse.ok) {
      return new Response(
        JSON.stringify({ error: githubData.message || 'GitHub API error', details: githubData }),
        { 
          status: githubResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify(githubData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})