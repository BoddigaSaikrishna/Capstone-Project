// Live GitHub REST API Client & Service Layer

export interface RealGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  default_branch: string;
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  bio: string | null;
  html_url: string;
}

export interface CreateRepoPayload {
  name: string;
  description?: string;
  private?: boolean;
  auto_init?: boolean;
}

export interface RealGitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface RealGitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Standardized Auth Headers helper
 */
function getHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    // Supports both fine-grained PATs (Bearer) and classic PATs (token)
    headers['Authorization'] = token.startsWith('ghp_') || token.startsWith('github_pat_')
      ? `Bearer ${token.trim()}`
      : `token ${token.trim()}`;
  }
  return headers;
}

/**
 * Helper to handle GitHub API error responses with rich user feedback
 */
async function handleApiError(response: Response, context: string): Promise<never> {
  let jsonErr: any = {};
  try {
    jsonErr = await response.json();
  } catch {
    /* empty */
  }

  const msg = jsonErr.message || response.statusText;
  if (response.status === 401) {
    throw new Error(`GitHub Authentication Failed (401): Check your Personal Access Token. ${msg}`);
  }
  if (response.status === 403) {
    throw new Error(`GitHub Access Denied / Rate Limit Exceeded (403): ${msg}`);
  }
  if (response.status === 404) {
    throw new Error(`GitHub Resource Not Found (404) for ${context}.`);
  }
  if (response.status === 422) {
    throw new Error(`Validation Error (422): ${msg}`);
  }

  throw new Error(`GitHub API Error (${response.status}): ${msg}`);
}

// ─── Fetch User Repositories ───────────────────────────────────────────────

export async function fetchUserRepos(username: string, token?: string): Promise<RealGitHubRepo[]> {
  const headers = getHeaders(token);
  const endpoint = token && token.trim()
    ? `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=15`
    : `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=15`;

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    await handleApiError(response, `repositories for user "${username}"`);
  }
  return response.json();
}

// ─── Fetch Repository Branches ─────────────────────────────────────────────

export async function fetchRepoBranches(owner: string, repo: string, token?: string): Promise<RealGitHubBranch[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
    { headers }
  );

  if (!response.ok) {
    await handleApiError(response, `branches of "${owner}/${repo}"`);
  }
  return response.json();
}

// ─── Fetch Repository Commits ──────────────────────────────────────────────

export async function fetchRepoCommits(owner: string, repo: string, token?: string): Promise<RealGitHubCommit[]> {
  const headers = getHeaders(token);
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=10`,
    { headers }
  );

  if (!response.ok) {
    await handleApiError(response, `commits of "${owner}/${repo}"`);
  }
  return response.json();
}

// ─── Fetch Authenticated User Profile ───────────────────────────────────────

export async function fetchAuthenticatedUser(token: string): Promise<GitHubUser> {
  const headers = getHeaders(token);
  const response = await fetch(`${GITHUB_API_BASE}/user`, { headers });
  if (!response.ok) {
    await handleApiError(response, 'authenticated user profile');
  }
  return response.json();
}

// ─── Create a Real GitHub Repository via PAT ────────────────────────────────

export async function createGitHubRepo(
  payload: CreateRepoPayload,
  token: string
): Promise<RealGitHubRepo> {
  const headers = {
    ...getHeaders(token),
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${GITHUB_API_BASE}/user/repos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: payload.name,
      description: payload.description ?? '',
      private: payload.private ?? false,
      auto_init: payload.auto_init ?? true,
    }),
  });

  if (!response.ok) {
    await handleApiError(response, `creation of repository "${payload.name}"`);
  }

  return response.json();
}

// ─── Create a New Git Branch on Remote Repo ─────────────────────────────────

export async function createRepoBranch(
  owner: string,
  repo: string,
  newBranchName: string,
  fromSha: string,
  token: string
): Promise<boolean> {
  const headers = {
    ...getHeaders(token),
    'Content-Type': 'application/json',
  };

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${newBranchName}`,
        sha: fromSha,
      }),
    }
  );

  if (!response.ok) {
    await handleApiError(response, `creation of branch "${newBranchName}"`);
  }

  return true;
}
