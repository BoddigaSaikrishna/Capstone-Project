// Live Jenkins REST API Client & Service Layer
import type { JenkinsPipeline, JenkinsBuild, Status } from '@/types';
import { jenkinsPipelines as mockPipelines, jenkinsBuilds as mockBuilds, jenkinsBuildLog as mockLog } from '@/api/mockData';

// Map Jenkins color statuses to app Status type
export function mapJenkinsColorToStatus(color: string): Status {
  if (!color) return 'idle';
  if (color.endsWith('_anime')) return 'running';
  switch (color) {
    case 'blue':
      return 'success';
    case 'red':
      return 'failed';
    case 'yellow':
      return 'warning';
    case 'aborted':
      return 'stopped';
    case 'disabled':
    case 'grey':
    case 'notbuilt':
    default:
      return 'idle';
  }
}

// Map Jenkins build result to app Status type
export function mapJenkinsResultToStatus(result: string | null): Status {
  if (!result) return 'running';
  switch (result.toUpperCase()) {
    case 'SUCCESS':
      return 'success';
    case 'FAILURE':
      return 'failed';
    case 'UNSTABLE':
      return 'warning';
    case 'ABORTED':
      return 'stopped';
    default:
      return 'idle';
  }
}

// Utility to generate Basic Auth header
function getAuthHeaders(username: string, token: string): HeadersInit {
  const creds = btoa(`${username}:${token}`);
  return {
    'Authorization': `Basic ${creds}`,
    'Accept': 'application/vnd.jenkins.v3+json, application/json',
  };
}

// Fetch all jobs from Jenkins server
export async function fetchJenkinsJobs(
  url: string,
  username: string,
  token: string
): Promise<JenkinsPipeline[]> {
  if (!url || !username || !token) {
    return mockPipelines;
  }

  const cleanUrl = url.replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/json?tree=jobs[name,url,color,lastBuild[number]]`, {
    headers: getAuthHeaders(username, token),
  });

  if (!response.ok) {
    throw new Error(`Jenkins API error: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.jobs || []).map((job: any) => ({
    id: `jp_${job.name}`,
    name: job.name,
    status: mapJenkinsColorToStatus(job.color),
    lastBuild: job.lastBuild?.number || 0,
    duration: 'N/A',
    triggeredBy: 'Jenkins Trigger',
  }));
}

// Fetch builds for a specific job
export async function fetchJenkinsBuilds(
  url: string,
  jobName: string,
  username: string,
  token: string
): Promise<JenkinsBuild[]> {
  if (!url || !username || !token) {
    return mockBuilds.filter(b => b.pipeline === jobName || jobName === '');
  }

  const cleanUrl = url.replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/job/${jobName}/api/json?tree=builds[number,url,result,duration,timestamp,actions[causes[shortDescription]]]`, {
    headers: getAuthHeaders(username, token),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch builds for job ${jobName}`);
  }

  const data = await response.json();
  return (data.builds || []).map((build: any) => {
    let triggeredBy = 'System';
    const causeAction = (build.actions || []).find((a: any) => a._class === 'hudson.model.CauseAction' || a.causes);
    if (causeAction && causeAction.causes && causeAction.causes.length > 0) {
      triggeredBy = causeAction.causes[0].shortDescription || 'User';
    }

    const durationSec = Math.round(build.duration / 1000);
    const durationStr = durationSec > 0 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : '0m 0s';

    return {
      id: `jb_${jobName}_${build.number}`,
      number: build.number,
      pipeline: jobName,
      status: mapJenkinsResultToStatus(build.result),
      duration: build.duration > 0 ? durationStr : 'In progress...',
      timestamp: new Date(build.timestamp).toISOString(),
      triggeredBy: triggeredBy.replace('Started by ', ''),
    };
  });
}

// Fetch console text/log output for a build
export async function fetchJenkinsBuildLog(
  url: string,
  jobName: string,
  buildNumber: number,
  username: string,
  token: string
): Promise<string> {
  if (!url || !username || !token) {
    return mockLog;
  }

  const cleanUrl = url.replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/job/${jobName}/${buildNumber}/consoleText`, {
    headers: getAuthHeaders(username, token),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch build logs for #${buildNumber}`);
  }

  return response.text();
}

// Trigger a Jenkins build job
export async function triggerJenkinsBuild(
  url: string,
  jobName: string,
  username: string,
  token: string
): Promise<boolean> {
  if (!url || !username || !token) {
    // If no credentials, we simulate build triggers locally
    return true;
  }

  const cleanUrl = url.replace(/\/$/, '');
  
  // 1. Get Crumb token (if CSRF protection is enabled, which is standard in modern Jenkins)
  let crumbHeaders: HeadersInit = {};
  try {
    const crumbRes = await fetch(`${cleanUrl}/crumbIssuer/api/json`, {
      headers: getAuthHeaders(username, token),
    });
    if (crumbRes.ok) {
      const crumbData = await crumbRes.json();
      if (crumbData.crumbRequestField && crumbData.crumb) {
        crumbHeaders = { [crumbData.crumbRequestField]: crumbData.crumb };
      }
    }
  } catch (e) {
    // Crumb issuer might not be configured, skip
  }

  // 2. Trigger the job build
  const response = await fetch(`${cleanUrl}/job/${jobName}/build`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(username, token),
      ...crumbHeaders,
    },
  });

  if (!response.ok && response.status !== 201) {
    throw new Error(`Failed to trigger build: ${response.statusText}`);
  }

  return true;
}
