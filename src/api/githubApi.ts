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

export async function fetchUserRepos(username: string, token?: string): Promise<RealGitHubRepo[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const endpoint = token
    ? `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=15`
    : `${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=15`;

  const response = await fetch(endpoint, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchRepoBranches(owner: string, repo: string, token?: string): Promise<RealGitHubBranch[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch branches for ${owner}/${repo}`);
  }
  return response.json();
}

export async function fetchRepoCommits(owner: string, repo: string, token?: string): Promise<RealGitHubCommit[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=10`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch commits for ${owner}/${repo}`);
  }
  return response.json();
}
