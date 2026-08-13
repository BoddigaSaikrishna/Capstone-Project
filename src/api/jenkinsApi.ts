// Live Jenkins REST API Client & Service Layer
// All requests go through /jenkins-proxy (Vite dev server proxy → ngrok → Jenkins)
// This avoids CORS errors when Jenkins is running on localhost behind ngrok.
import type { JenkinsPipeline, JenkinsBuild, Status } from '@/types';

// ─── Status Mappers ──────────────────────────────────────────────────────────

export function mapJenkinsColorToStatus(color: string): Status {
  if (!color) return 'idle';
  if (color.endsWith('_anime')) return 'running';
  switch (color) {
    case 'blue': return 'success';
    case 'red': return 'failed';
    case 'yellow': return 'warning';
    case 'aborted': return 'stopped';
    case 'disabled':
    case 'grey':
    case 'notbuilt':
    default: return 'idle';
  }
}

export function mapJenkinsResultToStatus(result: string | null): Status {
  if (!result) return 'running';
  switch (result.toUpperCase()) {
    case 'SUCCESS': return 'success';
    case 'FAILURE': return 'failed';
    case 'UNSTABLE': return 'warning';
    case 'ABORTED': return 'stopped';
    default: return 'idle';
  }
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

function getAuthHeaders(username: string, token: string): HeadersInit {
  const creds = btoa(`${username}:${token}`);
  return {
    'Authorization': `Basic ${creds}`,
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
}

/**
 * Resolve the base URL for Jenkins API calls.
 * - In development: use the Vite proxy at /jenkins-proxy (avoids CORS)
 * - If a custom URL is provided by the user (not same as env), use it directly
 */
function resolveBase(url: string): string {
  const envUrl = (import.meta.env.VITE_JENKINS_URL || '').replace(/\/$/, '');
  const inputUrl = url.replace(/\/$/, '');
  // If the URL matches the env-configured URL, use the Vite proxy path
  if (!inputUrl || inputUrl === envUrl) {
    return '/jenkins-proxy';
  }
  // Otherwise use the URL directly (user has entered a custom one)
  return inputUrl;
}

// ─── Connection Test ──────────────────────────────────────────────────────────

export interface JenkinsServerInfo {
  version: string;
  nodeName: string;
  numExecutors: number;
  description: string | null;
}

export async function testJenkinsConnection(
  url: string,
  username: string,
  token: string
): Promise<JenkinsServerInfo> {
  const base = resolveBase(url);
  const response = await fetch(`${base}/api/json?tree=nodeName,numExecutors,description`, {
    headers: getAuthHeaders(username, token),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error('Authentication failed — check username and API token.');
    if (response.status === 403) throw new Error('Access denied — your token lacks permissions.');
    throw new Error(`Jenkins responded with ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const version = response.headers.get('X-Jenkins') || 'Unknown';
  return {
    version,
    nodeName: data.nodeName || 'Jenkins Master',
    numExecutors: data.numExecutors ?? 0,
    description: data.description || null,
  };
}

// ─── Fetch Jobs ───────────────────────────────────────────────────────────────

export async function fetchJenkinsJobs(
  url: string,
  username: string,
  token: string
): Promise<JenkinsPipeline[]> {
  const base = resolveBase(url);
  const response = await fetch(
    `${base}/api/json?tree=jobs[name,url,color,lastBuild[number,duration,timestamp]]`,
    { headers: getAuthHeaders(username, token) }
  );

  if (!response.ok) {
    throw new Error(`Jenkins API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.jobs || []).map((job: any) => {
    const lb = job.lastBuild;
    const durationSec = lb?.duration ? Math.round(lb.duration / 1000) : 0;
    const durationStr = durationSec > 0
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : 'N/A';
    return {
      id: `jp_${job.name}`,
      name: job.name,
      status: mapJenkinsColorToStatus(job.color),
      lastBuild: lb?.number || 0,
      duration: durationStr,
      triggeredBy: 'Jenkins',
    };
  });
}

// ─── Fetch Builds for a Job ───────────────────────────────────────────────────

export async function fetchJenkinsBuilds(
  url: string,
  jobName: string,
  username: string,
  token: string
): Promise<JenkinsBuild[]> {
  const base = resolveBase(url);
  const response = await fetch(
    `${base}/job/${encodeURIComponent(jobName)}/api/json?tree=builds[number,result,duration,timestamp,actions[causes[shortDescription]]]`,
    { headers: getAuthHeaders(username, token) }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch builds for "${jobName}": ${response.statusText}`);
  }

  const data = await response.json();
  return (data.builds || []).map((build: any) => {
    let triggeredBy = 'System';
    const causeAction = (build.actions || []).find(
      (a: any) => a._class === 'hudson.model.CauseAction' || a.causes
    );
    if (causeAction?.causes?.length > 0) {
      triggeredBy = causeAction.causes[0].shortDescription?.replace('Started by ', '') || 'User';
    }

    const durationSec = Math.round(build.duration / 1000);
    const durationStr = durationSec > 0
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : 'In progress...';

    return {
      id: `jb_${jobName}_${build.number}`,
      number: build.number,
      pipeline: jobName,
      status: mapJenkinsResultToStatus(build.result),
      duration: build.duration > 0 ? durationStr : 'In progress...',
      timestamp: new Date(build.timestamp).toISOString(),
      triggeredBy,
    };
  });
}

// ─── Fetch Console Log ────────────────────────────────────────────────────────

export async function fetchJenkinsBuildLog(
  url: string,
  jobName: string,
  buildNumber: number,
  username: string,
  token: string
): Promise<string> {
  const base = resolveBase(url);
  const response = await fetch(
    `${base}/job/${encodeURIComponent(jobName)}/${buildNumber}/consoleText`,
    { headers: getAuthHeaders(username, token) }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch console log for build #${buildNumber}`);
  }

  return response.text();
}

// ─── Trigger a Build ──────────────────────────────────────────────────────────

export async function triggerJenkinsBuild(
  url: string,
  jobName: string,
  username: string,
  token: string
): Promise<boolean> {
  const base = resolveBase(url);

  // Try to get CSRF crumb first (required in Jenkins 2.x+)
  let crumbHeaders: HeadersInit = {};
  try {
    const crumbRes = await fetch(`${base}/crumbIssuer/api/json`, {
      headers: getAuthHeaders(username, token),
    });
    if (crumbRes.ok) {
      const crumbData = await crumbRes.json();
      if (crumbData.crumbRequestField && crumbData.crumb) {
        crumbHeaders = { [crumbData.crumbRequestField]: crumbData.crumb };
      }
    }
  } catch {
    // CSRF protection might not be enabled — proceed without crumb
  }

  const response = await fetch(`${base}/job/${encodeURIComponent(jobName)}/build`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(username, token),
      ...crumbHeaders,
    },
  });

  // 201 = queued successfully; 200 also acceptable
  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to trigger build: ${response.status} ${response.statusText}`);
  }

  return true;
}
