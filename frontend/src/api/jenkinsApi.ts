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
 * - In local development: use the Vite proxy at /jenkins-proxy for localhost / 127.0.0.1 (avoids CORS)
 * - If a custom URL is provided by the user, use it directly (or via proxy in dev)
 */
function resolveBase(url: string): string {
  const inputUrl = (url || '').trim().replace(/\/$/, '');
  const envUrl = (import.meta.env.VITE_JENKINS_URL || '').trim().replace(/\/$/, '');
  const isDev = import.meta.env.DEV;

  // In local development, always use /jenkins-proxy for localhost to eliminate CORS errors
  if (isDev) {
    if (!inputUrl || inputUrl.includes('localhost') || inputUrl.includes('127.0.0.1') || inputUrl === envUrl) {
      return '/jenkins-proxy';
    }
  }

  if (!inputUrl || inputUrl === envUrl) {
    return isDev ? '/jenkins-proxy' : (envUrl || inputUrl);
  }

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
  try {
    const response = await fetch(`${base}/api/json?tree=nodeName,numExecutors,description`, {
      headers: getAuthHeaders(username, token),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Authentication failed (401) — check your username and API token.');
      if (response.status === 403) throw new Error('Access denied (403) — user lacks API permissions or CSRF crumb.');
      if (response.status === 404) throw new Error(`Jenkins API endpoint not found (404) at ${base}. Check your URL.`);
      throw new Error(`Jenkins responded with HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Endpoint did not return Jenkins JSON data (received ${contentType || 'non-JSON'}).`);
    }

    const data = await response.json();
    const version = response.headers.get('X-Jenkins') || response.headers.get('x-jenkins') || 'Unknown';
    return {
      version,
      nodeName: data.nodeName || 'Jenkins Master',
      numExecutors: data.numExecutors ?? 0,
      description: data.description || null,
    };
  } catch (err: any) {
    if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if (isHttps && (url.startsWith('http:') || url.includes('localhost') || url.includes('127.0.0.1'))) {
        throw new Error(
          'Browser blocked connection: The live HTTPS site (Vercel) cannot access insecure HTTP localhost (Mixed Content & CORS). To connect your local Jenkins, run the project locally (http://localhost:5173) or expose Jenkins with an HTTPS tunnel (e.g., ngrok http 8080).'
        );
      }
      throw new Error(`Cannot reach Jenkins at ${url}. Check if Jenkins is running and network/CORS is allowed.`);
    }
    throw err;
  }
}

// ─── Fetch Jobs ───────────────────────────────────────────────────────────────

export async function fetchJenkinsJobs(
  url: string,
  username: string,
  token: string
): Promise<JenkinsPipeline[]> {
  const base = resolveBase(url);
  const response = await fetch(
    `${base}/api/json?tree=jobs[name,url,color,inQueue,lastBuild[number,duration,timestamp,building,result]]`,
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
      : (lb?.building || job.inQueue ? 'In progress...' : 'N/A');
    const isRunning = Boolean(job.inQueue || lb?.building || (job.color && job.color.endsWith('_anime')));
    return {
      id: `jp_${job.name}`,
      name: job.name,
      status: isRunning ? 'running' : mapJenkinsColorToStatus(job.color),
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

// ─── Stop / Abort a Running or Queued Build ───────────────────────────────────

export async function stopJenkinsBuild(
  url: string,
  jobName: string,
  buildNumber: number,
  username: string,
  token: string
): Promise<boolean> {
  const base = resolveBase(url);
  const authHeaders = getAuthHeaders(username, token);

  // Try to get CSRF crumb first
  let crumbHeaders: HeadersInit = {};
  try {
    const crumbRes = await fetch(`${base}/crumbIssuer/api/json`, {
      headers: authHeaders,
    });
    if (crumbRes.ok) {
      const crumbData = await crumbRes.json();
      if (crumbData.crumbRequestField && crumbData.crumb) {
        crumbHeaders = { [crumbData.crumbRequestField]: crumbData.crumb };
      }
    }
  } catch {
    // CSRF protection optional for API tokens
  }

  const postWithAuth = async (endpoint: string) => {
    try {
      const res = await fetch(`${base}${endpoint}`, {
        method: 'POST',
        redirect: 'manual',
        headers: {
          ...authHeaders,
          ...crumbHeaders,
        },
      });
      return res.ok || res.status === 302 || res.status === 200 || res.type === 'opaqueredirect';
    } catch {
      return false;
    }
  };

  const encodedJob = encodeURIComponent(jobName);
  let stopped = false;

  // 1. Try standard Jenkins /stop if we have a build number
  if (buildNumber > 0) {
    stopped = await postWithAuth(`/job/${encodedJob}/${buildNumber}/stop`);

    // Give Jenkins a brief moment to process soft stop
    await new Promise((r) => setTimeout(r, 350));

    // Check if the build actually stopped or is still building (e.g. stuck in executor wait / bat step)
    let stillBuilding = true;
    try {
      const checkRes = await fetch(
        `${base}/job/${encodedJob}/${buildNumber}/api/json?tree=building,result`,
        { headers: authHeaders }
      );
      if (checkRes.ok) {
        const info = await checkRes.json();
        stillBuilding = Boolean(info.building);
      }
    } catch {
      // keep stillBuilding = true so we escalate
    }

    if (stillBuilding) {
      await postWithAuth(`/job/${encodedJob}/${buildNumber}/term`);
      await postWithAuth(`/job/${encodedJob}/${buildNumber}/kill`);
    }
  }

  // 2. Also cancel any queued items for this job (handles jobs / node{} tasks stuck waiting for an executor)
  try {
    const qRes = await fetch(`${base}/queue/api/json?tree=items[id,task[name,fullDisplayName]]`, {
      headers: authHeaders,
    });
    if (qRes.ok) {
      const qData = await qRes.json();
      const matching = (qData.items || []).filter(
        (item: any) =>
          item?.task?.name === jobName ||
          (typeof item?.task?.fullDisplayName === 'string' && item.task.fullDisplayName.includes(jobName))
      );
      for (const item of matching) {
        const qOk = await postWithAuth(`/queue/cancelItem?id=${item.id}`);
        if (qOk) stopped = true;
      }
    }
  } catch {
    // ignore queue lookup error
  }

  // 3. Authoritative Groovy Script Console escalation: force-stops stubborn Pipeline steps & queued PlaceholderTasks
  try {
    const safeJob = jobName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const scriptBody = [
      `def inst = jenkins.model.Jenkins.instance;`,
      `def q = inst.queue;`,
      `q.items.findAll { it.task?.name == '${safeJob}' || it.task?.fullDisplayName?.contains('${safeJob}') }.each { q.cancel(it) };`,
      `def j = inst.getItemByFullName('${safeJob}');`,
      `if (j) {`,
      `  if (${buildNumber} > 0) {`,
      `    def b = j.getBuildByNumber(${buildNumber});`,
      `    if (b && b.isBuilding()) { b.doStop(); Thread.sleep(250); if (b.isBuilding()) b.doTerm(); Thread.sleep(250); if (b.isBuilding()) b.doKill(); }`,
      `  }`,
      `  j.getBuilds().findAll { it.isBuilding() }.each { it.doStop(); Thread.sleep(200); if (it.isBuilding()) it.doTerm(); Thread.sleep(200); if (it.isBuilding()) it.doKill(); }`,
      `}`,
      `println('ABORT_OK');`,
    ].join('\n');

    const scriptRes = await fetch(`${base}/scriptText`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        ...crumbHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ script: scriptBody }),
    });
    if (scriptRes.ok) {
      stopped = true;
    }
  } catch {
    // ignore script fallback error if standard endpoint already succeeded
  }

  if (!stopped) {
    throw new Error(`Failed to abort "${jobName}"${buildNumber > 0 ? ` build #${buildNumber}` : ''}.`);
  }

  return true;
}

// ─── Create New Item / Job ───────────────────────────────────────────────────

export interface CreateJenkinsJobParams {
  jobName: string;
  description?: string;
  jobType: 'pipeline' | 'freestyle';
  pipelineScript?: string;
}

export async function createJenkinsJob(
  url: string,
  username: string,
  token: string,
  params: CreateJenkinsJobParams
): Promise<boolean> {
  const base = resolveBase(url);

  // 1. Fetch CSRF crumb header
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
    // CSRF protection optional
  }

  // 2. Generate XML configuration
  const scriptContent = params.pipelineScript || `pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source repository...'
            }
        }
        stage('Build & Test') {
            steps {
                echo 'Executing automated build and test pipeline...'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying artifact to target environment...'
            }
        }
    }
}`;

  const xml = params.jobType === 'pipeline'
    ? `<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <description>${params.description || 'Created from ML DevOps Control Center'}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script>${scriptContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</script>
    <sandbox>true</sandbox>
  </definition>
</flow-definition>`
    : `<?xml version='1.1' encoding='UTF-8'?>
<project>
  <description>${params.description || 'Created from ML DevOps Control Center'}</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <scm class="hudson.scm.NullSCM"/>
  <canRoam>true</canRoam>
  <disabled>false</disabled>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <triggers/>
  <concurrentBuild>false</concurrentBuild>
  <builders/>
  <publishers/>
  <buildWrappers/>
</project>`;

  // 3. Send POST request to Jenkins createItem
  const response = await fetch(`${base}/createItem?name=${encodeURIComponent(params.jobName)}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(username, token),
      ...crumbHeaders,
      'Content-Type': 'application/xml',
    },
    body: xml,
  });

  if (!response.ok) {
    throw new Error(`Failed to create item "${params.jobName}": ${response.status} ${response.statusText}`);
  }

  return true;
}

// ─── Plugins & Nodes API ─────────────────────────────────────────────────────

export interface JenkinsPlugin {
  shortName: string;
  longName: string;
  version: string;
  active: boolean;
  enabled: boolean;
}

export interface JenkinsNode {
  displayName: string;
  numExecutors: number;
  offline: boolean;
  temporarilyOffline: boolean;
  idle: boolean;
  assignedLabels: { name: string }[];
}

export async function fetchJenkinsPlugins(
  url: string,
  username: string,
  token: string
): Promise<JenkinsPlugin[]> {
  const base = resolveBase(url);
  const response = await fetch(
    `${base}/pluginManager/api/json?tree=plugins[shortName,longName,version,active,enabled]`,
    { headers: getAuthHeaders(username, token) }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch plugins: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.plugins || []).map((p: any) => ({
    shortName: p.shortName,
    longName: p.longName,
    version: p.version,
    active: !!p.active,
    enabled: !!p.enabled,
  }));
}

export async function fetchJenkinsNodes(
  url: string,
  username: string,
  token: string
): Promise<JenkinsNode[]> {
  const base = resolveBase(url);
  const response = await fetch(
    `${base}/computer/api/json?tree=computer[displayName,numExecutors,offline,temporarilyOffline,idle,assignedLabels[name]]`,
    { headers: getAuthHeaders(username, token) }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch nodes: ${response.statusText}`);
  }

  const data = await response.json();
  return (data.computer || []).map((c: any) => ({
    displayName: c.displayName,
    numExecutors: c.numExecutors || 0,
    offline: !!c.offline,
    temporarilyOffline: !!c.temporarilyOffline,
    idle: !!c.idle,
    assignedLabels: c.assignedLabels || [],
  }));
}


