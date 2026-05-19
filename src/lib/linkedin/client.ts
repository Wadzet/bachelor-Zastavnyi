import "server-only"

// ─── Config (all values server-only — never sent to browser) ─────────────────

function getConfig() {
  const clientId     = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  const redirectUri  = process.env.LINKEDIN_REDIRECT_URI
  const apiVersion   = process.env.LINKEDIN_API_VERSION ?? "202412"

  if (!clientId)     throw new Error("[linkedin] LINKEDIN_CLIENT_ID is not set.")
  if (!clientSecret) throw new Error("[linkedin] LINKEDIN_CLIENT_SECRET is not set.")
  if (!redirectUri)  throw new Error("[linkedin] LINKEDIN_REDIRECT_URI is not set.")

  return { clientId, clientSecret, redirectUri, apiVersion }
}

// Scopes required for member profile posting via w_member_social.
// openid + profile + email enables OIDC userinfo for member identity.
const OAUTH_SCOPES = ["openid", "profile", "email", "w_member_social"]

// ─── Authorization URL ────────────────────────────────────────────────────────

export function buildAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getConfig()
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     clientId,
    redirect_uri:  redirectUri,
    scope:         OAUTH_SCOPES.join(" "),
    state,
  })
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export type LinkedInTokenResponse = {
  access_token:              string
  expires_in:                number   // seconds until expiry (typically 5183999 ≈ 60 days)
  refresh_token?:            string
  refresh_token_expires_in?: number
}

export async function exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getConfig()

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      redirect_uri:  redirectUri,
      client_id:     clientId,
      client_secret: clientSecret,
    }).toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    // Never log clientSecret — log only status + truncated body
    throw new Error(`LinkedIn token exchange failed (${res.status}): ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<LinkedInTokenResponse>
}

// ─── Member identity ──────────────────────────────────────────────────────────
// Uses OIDC userinfo endpoint — available when openid + profile scopes are granted.
// The `sub` field is the stable LinkedIn member ID used to build the author URN.

export type LinkedInUserInfo = {
  sub:          string   // Stable member ID (used in urn:li:person:{sub})
  name?:        string
  given_name?:  string
  family_name?: string
  email?:       string
}

export async function getMemberInfo(accessToken: string): Promise<LinkedInUserInfo> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`LinkedIn userinfo failed (${res.status}): ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<LinkedInUserInfo>
}

// ─── Create LinkedIn post ─────────────────────────────────────────────────────
// Uses the LinkedIn Posts API (REST) with required versioning headers.
// Posts to the member's personal feed with PUBLIC visibility.
// Returns the post URN from the x-restli-id response header on success.

export type LinkedInPostResult = {
  ok:      boolean
  postId?: string   // LinkedIn post URN, e.g. "urn:li:share:1234567890"
  error?:  string   // Safe error string — never includes access token
}

export async function createLinkedInPost({
  accessToken,
  memberUrn,
  text,
}: {
  accessToken: string
  memberUrn:   string   // "urn:li:person:{sub}"
  text:        string
}): Promise<LinkedInPostResult> {
  const { apiVersion } = getConfig()

  const payload = {
    author:      memberUrn,
    commentary:  text,
    visibility:  "PUBLIC",
    distribution: {
      feedDistribution:               "MAIN_FEED",
      targetEntities:                 [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState:            "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }

  let res: Response
  try {
    res = await fetch("https://api.linkedin.com/rest/posts", {
      method:  "POST",
      headers: {
        Authorization:              `Bearer ${accessToken}`,
        "Content-Type":             "application/json",
        "LinkedIn-Version":         apiVersion,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown network error"
    return { ok: false, error: `Network error posting to LinkedIn: ${msg.slice(0, 200)}` }
  }

  if (!res.ok) {
    const text = await res.text()
    // Safe error — never includes access token or client secret
    return { ok: false, error: `LinkedIn API error (${res.status}): ${text.slice(0, 200)}` }
  }

  // 201 Created — LinkedIn returns the post URN in x-restli-id header
  const postId = res.headers.get("x-restli-id") ?? undefined

  return { ok: true, postId }
}
