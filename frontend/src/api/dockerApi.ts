// Live Docker Engine REST API Client
// All requests go through /docker-proxy (Vite dev server proxy → Docker Engine on port 2375)
// Docker Engine must be exposed via TCP with: dockerd -H tcp://0.0.0.0:2375
// Or on Windows Desktop Docker: enable "Expose daemon on tcp://localhost:2375 without TLS"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  Status: string;
  State: string;
  Ports: { IP?: string; PrivatePort: number; PublicPort?: number; Type: string }[];
  Created: number;
  SizeRw?: number;
  Mounts: { Type: string; Source: string; Destination: string; Mode: string }[];
  NetworkSettings?: { Networks: Record<string, { IPAddress: string }> };
}

export interface DockerImage {
  Id: string;
  RepoTags: string[] | null;
  Size: number;
  Created: number;
  Containers: number;
  Labels: Record<string, string> | null;
}

export interface DockerVolume {
  Name: string;
  Driver: string;
  Mountpoint: string;
  CreatedAt: string;
  Labels: Record<string, string> | null;
}

export interface DockerNetwork {
  Id: string;
  Name: string;
  Driver: string;
  Scope: string;
  IPAM: { Config: { Subnet?: string; Gateway?: string }[] };
  Containers: Record<string, { Name: string; IPv4Address: string }>;
}

export interface DockerSystemInfo {
  Containers: number;
  ContainersRunning: number;
  ContainersPaused: number;
  ContainersStopped: number;
  Images: number;
  ServerVersion: string;
  OperatingSystem: string;
  NCPU: number;
  MemTotal: number;
  DockerRootDir: string;
  KernelVersion: string;
}

export interface DockerStats {
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  memory_percent: number;
  network_rx: number;
  network_tx: number;
  block_read: number;
  block_write: number;
}

// ─── Base URL ─────────────────────────────────────────────────────────────────

export function getDockerBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('mldevops_docker_url');
    if (custom) return custom.replace(/\/$/, '');
  }
  const envUrl = (import.meta.env.VITE_DOCKER_HOST || '').replace(/\/$/, '');
  if (envUrl) return envUrl;
  return '/docker-proxy';
}

export function setDockerBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '' || url === '/docker-proxy') {
      localStorage.removeItem('mldevops_docker_url');
    } else {
      localStorage.setItem('mldevops_docker_url', url.trim().replace(/\/$/, ''));
    }
  }
}

// ─── Connection Test ──────────────────────────────────────────────────────────

export async function testDockerConnection(): Promise<DockerSystemInfo> {
  const base = getDockerBaseUrl();
  try {
    const res = await fetch(`${base}/info`);
    if (!res.ok) {
      throw new Error(`Docker Engine at ${base} is unreachable (${res.status} ${res.statusText}).`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if (isHttps && (base.startsWith('http:') || base.includes('localhost') || base === '/docker-proxy')) {
        throw new Error(
          'Browser blocked connection: The live HTTPS site (Vercel) cannot access insecure HTTP localhost (Mixed Content & CORS). To connect your local Docker daemon, run the project locally (npm run dev) or expose Docker Engine with an HTTPS tunnel / remote host.'
        );
      }
      throw new Error(`Docker Engine at ${base} returned non-JSON response.`);
    }
    return await res.json();
  } catch (err: any) {
    if (err?.message?.includes('JSON') || err?.message?.includes('token') || err?.name === 'SyntaxError') {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      if (isHttps && (base.startsWith('http:') || base.includes('localhost') || base === '/docker-proxy')) {
        throw new Error(
          'Browser blocked connection: The live HTTPS site (Vercel) cannot access insecure HTTP localhost (Mixed Content & CORS). To connect your local Docker daemon, run the project locally (npm run dev) or expose Docker Engine with an HTTPS tunnel / remote host.'
        );
      }
      throw new Error(`Docker Engine at ${base} is unreachable.`);
    }
    throw err;
  }
}

// ─── Containers ───────────────────────────────────────────────────────────────

export async function fetchDockerContainers(): Promise<DockerContainer[]> {
  try {
    const res = await fetch(`${getDockerBaseUrl()}/containers/json?all=true&size=true`);
    if (!res.ok) return [];
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function startContainer(id: string): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}/start`, { method: 'POST' });
  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to start container: ${res.statusText}`);
  }
}

export async function stopContainer(id: string): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}/stop`, { method: 'POST' });
  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to stop container: ${res.statusText}`);
  }
}

export async function restartContainer(id: string): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}/restart`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to restart container: ${res.statusText}`);
}

export async function removeContainer(id: string, force = false): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}?force=${force}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to remove container: ${res.statusText}`);
}

export interface CreateContainerOptions {
  name?: string;
  image: string;
  hostPort?: string;
  containerPort?: string;
  env?: string[];
  startImmediately?: boolean;
}

export async function createContainer(options: CreateContainerOptions): Promise<{ Id: string }> {
  const query = options.name?.trim() ? `?name=${encodeURIComponent(options.name.trim())}` : '';
  const body: any = {
    Image: options.image.trim(),
  };

  if (options.env && options.env.length > 0) {
    body.Env = options.env.filter((e) => e.trim().length > 0);
  }

  if (options.containerPort && options.hostPort) {
    const cPort = options.containerPort.trim();
    const hPort = options.hostPort.trim();
    const portKey = cPort.includes('/') ? cPort : `${cPort}/tcp`;
    body.ExposedPorts = { [portKey]: {} };
    body.HostConfig = {
      PortBindings: {
        [portKey]: [{ HostPort: hPort }],
      },
    };
  }

  const res = await fetch(`${getDockerBaseUrl()}/containers/create${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(errData.message || `Failed to create container: ${res.statusText}`);
  }

  const result = await res.json();
  if (options.startImmediately !== false && result.Id) {
    await startContainer(result.Id);
  }
  return result;
}

export async function fetchContainerLogs(id: string, tail = 100): Promise<string> {
  const res = await fetch(
    `${getDockerBaseUrl()}/containers/${id}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=true`
  );
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`);
  // Docker multiplexed stream - extract text frames
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const lines: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) break;
    // 8-byte header: [stream_type, 0, 0, 0, size(4 bytes big-endian)]
    const size =
      (bytes[offset + 4] << 24) |
      (bytes[offset + 5] << 16) |
      (bytes[offset + 6] << 8) |
      bytes[offset + 7];
    offset += 8;
    if (size > 0 && offset + size <= bytes.length) {
      lines.push(new TextDecoder().decode(bytes.slice(offset, offset + size)));
    }
    offset += size;
  }
  return lines.join('') || new TextDecoder().decode(bytes);
}

export async function fetchContainerStats(id: string): Promise<DockerStats> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}/stats?stream=false`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  const raw = await res.json();

  const cpuDelta =
    (raw.cpu_stats?.cpu_usage?.total_usage ?? 0) -
    (raw.precpu_stats?.cpu_usage?.total_usage ?? 0);
  const systemDelta =
    (raw.cpu_stats?.system_cpu_usage ?? 0) -
    (raw.precpu_stats?.system_cpu_usage ?? 0);
  const numCpus = raw.cpu_stats?.online_cpus || raw.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
  const cpu_percent = systemDelta > 0 ? (cpuDelta / systemDelta) * numCpus * 100 : 0;

  const mem_usage = raw.memory_stats?.usage ?? 0;
  const mem_limit = raw.memory_stats?.limit ?? 1;
  const mem_cache = raw.memory_stats?.stats?.cache ?? 0;
  const actual_mem = mem_usage - mem_cache;

  const netRx = Object.values(raw.networks ?? {}).reduce(
    (sum: number, n: any) => sum + (n.rx_bytes ?? 0), 0
  );
  const netTx = Object.values(raw.networks ?? {}).reduce(
    (sum: number, n: any) => sum + (n.tx_bytes ?? 0), 0
  );
  const blkRead = (raw.blkio_stats?.io_service_bytes_recursive ?? [])
    .filter((b: any) => b.op === 'Read')
    .reduce((sum: number, b: any) => sum + b.value, 0);
  const blkWrite = (raw.blkio_stats?.io_service_bytes_recursive ?? [])
    .filter((b: any) => b.op === 'Write')
    .reduce((sum: number, b: any) => sum + b.value, 0);

  return {
    cpu_percent: parseFloat(cpu_percent.toFixed(2)),
    memory_usage: actual_mem,
    memory_limit: mem_limit,
    memory_percent: parseFloat(((actual_mem / mem_limit) * 100).toFixed(2)),
    network_rx: netRx,
    network_tx: netTx,
    block_read: blkRead,
    block_write: blkWrite,
  };
}

// ─── Images ───────────────────────────────────────────────────────────────────

export async function fetchDockerImages(): Promise<DockerImage[]> {
  try {
    const res = await fetch(`${getDockerBaseUrl()}/images/json?all=false`);
    if (!res.ok) return [];
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function removeImage(id: string, force = false): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/images/${id}?force=${force}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to remove image: ${res.statusText}`);
}

export async function pullImage(imageName: string): Promise<void> {
  const [repo, tag = 'latest'] = imageName.includes(':')
    ? imageName.split(':')
    : [imageName, 'latest'];
  const res = await fetch(
    `${getDockerBaseUrl()}/images/create?fromImage=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Failed to pull image: ${res.statusText}`);
}

export async function pauseContainer(id: string): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}/pause`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to pause container: ${res.statusText}`);
}

export async function unpauseContainer(id: string): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/containers/${id}/unpause`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to unpause container: ${res.statusText}`);
}

export async function inspectItem(type: 'containers' | 'images' | 'volumes' | 'networks', id: string): Promise<any> {
  const endpoint = type === 'volumes' ? `${getDockerBaseUrl()}/volumes/${encodeURIComponent(id)}` : `${getDockerBaseUrl()}/${type}/${encodeURIComponent(id)}/json`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Failed to inspect ${type}: ${res.statusText}`);
  return res.json();
}

export async function execContainer(id: string, cmd: string[]): Promise<string> {
  // 1. Create Exec instance
  const createRes = await fetch(`${getDockerBaseUrl()}/containers/${id}/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      Cmd: cmd,
    }),
  });

  if (!createRes.ok) throw new Error(`Failed to create exec process: ${createRes.statusText}`);
  const { Id: execId } = await createRes.json();

  // 2. Start Exec instance
  const startRes = await fetch(`${getDockerBaseUrl()}/exec/${execId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Detach: false, Tty: false }),
  });

  if (!startRes.ok) throw new Error(`Failed to run command: ${startRes.statusText}`);

  const buffer = await startRes.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const lines: string[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) break;
    const size =
      (bytes[offset + 4] << 24) |
      (bytes[offset + 5] << 16) |
      (bytes[offset + 6] << 8) |
      bytes[offset + 7];
    offset += 8;
    if (size > 0 && offset + size <= bytes.length) {
      lines.push(new TextDecoder().decode(bytes.slice(offset, offset + size)));
    }
    offset += size;
  }
  return lines.join('') || new TextDecoder().decode(bytes);
}

// ─── Volumes ──────────────────────────────────────────────────────────────────

export async function fetchDockerVolumes(): Promise<DockerVolume[]> {
  try {
    const res = await fetch(`${getDockerBaseUrl()}/volumes`);
    if (!res.ok) return [];
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return [];
    const data = await res.json();
    return data.Volumes ?? [];
  } catch {
    return [];
  }
}

export async function createVolume(name: string, driver = 'local'): Promise<DockerVolume> {
  const res = await fetch(`${getDockerBaseUrl()}/volumes/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Name: name, Driver: driver }),
  });
  if (!res.ok) throw new Error(`Failed to create volume: ${res.statusText}`);
  return res.json();
}

export async function removeVolume(name: string, force = false): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/volumes/${encodeURIComponent(name)}?force=${force}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove volume: ${res.statusText}`);
}

// ─── Networks ─────────────────────────────────────────────────────────────────

export async function fetchDockerNetworks(): Promise<DockerNetwork[]> {
  try {
    const res = await fetch(`${getDockerBaseUrl()}/networks`);
    if (!res.ok) return [];
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createNetwork(name: string, driver = 'bridge'): Promise<{ Id: string }> {
  const res = await fetch(`${getDockerBaseUrl()}/networks/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Name: name, Driver: driver }),
  });
  if (!res.ok) throw new Error(`Failed to create network: ${res.statusText}`);
  return res.json();
}

export async function removeNetwork(id: string): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/networks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove network: ${res.statusText}`);
}

export async function tagImage(id: string, repo: string, tag = 'latest'): Promise<void> {
  const res = await fetch(
    `${getDockerBaseUrl()}/images/${encodeURIComponent(id)}/tag?repo=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Failed to tag image: ${res.statusText}`);
}

export async function pruneSystem(): Promise<{
  ContainersDeleted: string[] | null;
  ImagesDeleted: any[] | null;
  NetworksDeleted: string[] | null;
  VolumesDeleted: string[] | null;
  SpaceReclaimed: number;
}> {
  const [cRes, iRes, nRes, vRes] = await Promise.all([
    fetch(`${getDockerBaseUrl()}/containers/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
    fetch(`${getDockerBaseUrl()}/images/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
    fetch(`${getDockerBaseUrl()}/networks/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
    fetch(`${getDockerBaseUrl()}/volumes/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
  ]);

  const spaceReclaimed = (cRes.SpaceReclaimed || 0) + (iRes.SpaceReclaimed || 0) + (vRes.SpaceReclaimed || 0);
  return {
    ContainersDeleted: cRes.ContainersDeleted ?? null,
    ImagesDeleted: iRes.ImagesDeleted ?? null,
    NetworksDeleted: nRes.NetworksDeleted ?? null,
    VolumesDeleted: vRes.VolumesDeleted ?? null,
    SpaceReclaimed: spaceReclaimed,
  };
}

// ─── Deployment & Registry Operations ─────────────────────────────────────────

export async function pushDockerImage(
  imageTag: string,
  authConfig?: { username?: string; password?: string; serveraddress?: string }
): Promise<string> {
  const [repo, tag = 'latest'] = imageTag.includes(':') ? imageTag.split(':') : [imageTag, 'latest'];
  const headers: Record<string, string> = {};

  if (authConfig && (authConfig.username || authConfig.password)) {
    const authHeader = btoa(
      JSON.stringify({
        username: authConfig.username || '',
        password: authConfig.password || '',
        serveraddress: authConfig.serveraddress || 'https://index.docker.io/v1/',
      })
    );
    headers['X-Registry-Auth'] = authHeader;
  }

  const res = await fetch(`${getDockerBaseUrl()}/images/${encodeURIComponent(repo)}/push?tag=${encodeURIComponent(tag)}`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) throw new Error(`Push failed: ${res.statusText}`);

  const text = await res.text();
  return text || 'Image pushed successfully to registry.';
}

export function getExportImageTarUrl(imageTag: string): string {
  return `${getDockerBaseUrl()}/images/${encodeURIComponent(imageTag)}/get`;
}

export async function importImageTar(file: File): Promise<void> {
  const res = await fetch(`${getDockerBaseUrl()}/images/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-tar' },
    body: file,
  });
  if (!res.ok) throw new Error(`Import failed: ${res.statusText}`);
}

export async function deployComposeServices(
  services: {
    name: string;
    image: string;
    containerName?: string;
    hostPort?: string;
    containerPort?: string;
    env?: string[];
  }[]
): Promise<string[]> {
  const createdIds: string[] = [];
  for (const s of services) {
    const created = await createContainer({
      image: s.image,
      name: s.containerName || s.name,
      hostPort: s.hostPort,
      containerPort: s.containerPort,
      env: s.env,
      startImmediately: true,
    });
    createdIds.push(created.Id);
  }
  return createdIds;
}

export interface DockerDiskUsage {
  LayersSize: number;
  Images: { Size: number; SharedSize: number }[];
  Containers: { SizeRw: number; SizeRootFs: number }[];
  Volumes: { UsageData: { Size: number } }[];
}

export async function fetchDockerDiskUsage(): Promise<DockerDiskUsage> {
  const res = await fetch(`${getDockerBaseUrl()}/system/df`);
  if (!res.ok) throw new Error(`Failed to fetch disk usage: ${res.statusText}`);
  return res.json();
}

// ─── In-Memory POSIX USTAR Tarball Generator ─────────────────────────────────

export function createTarball(files: { name: string; content: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const blocks: Uint8Array[] = [];

  for (const file of files) {
    const contentBytes = encoder.encode(file.content);
    const header = new Uint8Array(512);

    // 0..99: filename (null-padded)
    const nameBytes = encoder.encode(file.name);
    header.set(nameBytes.subarray(0, 100), 0);

    // 100..107: file mode (0000644\0)
    header.set(encoder.encode('0000644\0'), 100);

    // 108..115: uid (0000000\0)
    header.set(encoder.encode('0000000\0'), 108);

    // 116..123: gid (0000000\0)
    header.set(encoder.encode('0000000\0'), 116);

    // 124..135: file size in octal (11 digits + null)
    const sizeOctal = contentBytes.length.toString(8).padStart(11, '0') + '\0';
    header.set(encoder.encode(sizeOctal), 124);

    // 136..147: mtime in octal
    const mtimeOctal = Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0';
    header.set(encoder.encode(mtimeOctal), 136);

    // 148..155: checksum - fill with 8 spaces initially
    header.set(encoder.encode('        '), 148);

    // 156: typeflag ('0' = regular file)
    header[156] = 48; // '0'

    // 257..262: magic ("ustar\0")
    header.set(encoder.encode('ustar\0'), 257);

    // 263..264: version ("00")
    header.set(encoder.encode('00'), 263);

    // Calculate checksum: sum of all 512 bytes treating each byte as unsigned
    let checksum = 0;
    for (let i = 0; i < 512; i++) {
      checksum += header[i];
    }
    const chkStr = checksum.toString(8).padStart(6, '0') + '\0 ';
    header.set(encoder.encode(chkStr), 148);

    blocks.push(header);
    blocks.push(contentBytes);

    // Content padding to 512-byte boundary
    const remainder = contentBytes.length % 512;
    if (remainder > 0) {
      blocks.push(new Uint8Array(512 - remainder));
    }
  }

  // End of archive: two 512-byte null blocks
  blocks.push(new Uint8Array(1024));

  const totalLength = blocks.reduce((acc, b) => acc + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const b of blocks) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

export async function buildImageFromDockerfile(dockerfileText: string, tag: string): Promise<string> {
  // Generate a valid POSIX ustar archive containing the Dockerfile
  const tarBuffer = createTarball([{ name: 'Dockerfile', content: dockerfileText }]);

  const res = await fetch(`${getDockerBaseUrl()}/build?t=${encodeURIComponent(tag)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-tar' },
    body: tarBuffer,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Build failed: ${errText || res.statusText}`);
  }

  const text = await res.text();
  return text || `Successfully built image ${tag}`;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getContainerName(c: DockerContainer): string {
  return (c.Names?.[0] ?? c.Id.slice(0, 12)).replace(/^\//, '');
}

export function getContainerPorts(c: DockerContainer): string {
  if (!c.Ports?.length) return '—';
  return c.Ports
    .filter((p) => p.PublicPort)
    .map((p) => `${p.PublicPort}:${p.PrivatePort}`)
    .join(', ') || '—';
}

export function mapDockerState(state: string): 'running' | 'failed' | 'idle' | 'warning' {
  switch (state?.toLowerCase()) {
    case 'running': return 'running';
    case 'exited': return 'failed';
    case 'paused': return 'warning';
    default: return 'idle';
  }
}


