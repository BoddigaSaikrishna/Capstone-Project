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

const DOCKER_BASE = '/docker-proxy';

// ─── Connection Test ──────────────────────────────────────────────────────────

export async function testDockerConnection(): Promise<DockerSystemInfo> {
  const res = await fetch(`${DOCKER_BASE}/info`);
  if (!res.ok) {
    if (res.status === 0 || res.status === 500 || res.status === 502 || res.status === 503 || res.type === 'opaque') {
      throw new Error('Docker Engine TCP API (localhost:2375) is unreachable.');
    }
    throw new Error(`Docker API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Containers ───────────────────────────────────────────────────────────────

export async function fetchDockerContainers(): Promise<DockerContainer[]> {
  const res = await fetch(`${DOCKER_BASE}/containers/json?all=true&size=true`);
  if (!res.ok) throw new Error(`Failed to fetch containers: ${res.statusText}`);
  return res.json();
}

export async function startContainer(id: string): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/containers/${id}/start`, { method: 'POST' });
  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to start container: ${res.statusText}`);
  }
}

export async function stopContainer(id: string): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/containers/${id}/stop`, { method: 'POST' });
  if (!res.ok && res.status !== 304) {
    throw new Error(`Failed to stop container: ${res.statusText}`);
  }
}

export async function restartContainer(id: string): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/containers/${id}/restart`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to restart container: ${res.statusText}`);
}

export async function removeContainer(id: string, force = false): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/containers/${id}?force=${force}`, { method: 'DELETE' });
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

  const res = await fetch(`${DOCKER_BASE}/containers/create${query}`, {
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
    `${DOCKER_BASE}/containers/${id}/logs?stdout=true&stderr=true&tail=${tail}&timestamps=true`
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
  const res = await fetch(`${DOCKER_BASE}/containers/${id}/stats?stream=false`);
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
  const res = await fetch(`${DOCKER_BASE}/images/json?all=false`);
  if (!res.ok) throw new Error(`Failed to fetch images: ${res.statusText}`);
  return res.json();
}

export async function removeImage(id: string, force = false): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/images/${id}?force=${force}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to remove image: ${res.statusText}`);
}

export async function pullImage(imageName: string): Promise<void> {
  const [repo, tag = 'latest'] = imageName.includes(':')
    ? imageName.split(':')
    : [imageName, 'latest'];
  const res = await fetch(
    `${DOCKER_BASE}/images/create?fromImage=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Failed to pull image: ${res.statusText}`);
}

export async function pauseContainer(id: string): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/containers/${id}/pause`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to pause container: ${res.statusText}`);
}

export async function unpauseContainer(id: string): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/containers/${id}/unpause`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to unpause container: ${res.statusText}`);
}

export async function inspectItem(type: 'containers' | 'images' | 'volumes' | 'networks', id: string): Promise<any> {
  const endpoint = type === 'volumes' ? `${DOCKER_BASE}/volumes/${encodeURIComponent(id)}` : `${DOCKER_BASE}/${type}/${encodeURIComponent(id)}/json`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Failed to inspect ${type}: ${res.statusText}`);
  return res.json();
}

export async function execContainer(id: string, cmd: string[]): Promise<string> {
  // 1. Create Exec instance
  const createRes = await fetch(`${DOCKER_BASE}/containers/${id}/exec`, {
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
  const startRes = await fetch(`${DOCKER_BASE}/exec/${execId}/start`, {
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
  const res = await fetch(`${DOCKER_BASE}/volumes`);
  if (!res.ok) throw new Error(`Failed to fetch volumes: ${res.statusText}`);
  const data = await res.json();
  return data.Volumes ?? [];
}

export async function createVolume(name: string, driver = 'local'): Promise<DockerVolume> {
  const res = await fetch(`${DOCKER_BASE}/volumes/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Name: name, Driver: driver }),
  });
  if (!res.ok) throw new Error(`Failed to create volume: ${res.statusText}`);
  return res.json();
}

export async function removeVolume(name: string, force = false): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/volumes/${encodeURIComponent(name)}?force=${force}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove volume: ${res.statusText}`);
}

// ─── Networks ─────────────────────────────────────────────────────────────────

export async function fetchDockerNetworks(): Promise<DockerNetwork[]> {
  const res = await fetch(`${DOCKER_BASE}/networks`);
  if (!res.ok) throw new Error(`Failed to fetch networks: ${res.statusText}`);
  return res.json();
}

export async function createNetwork(name: string, driver = 'bridge'): Promise<{ Id: string }> {
  const res = await fetch(`${DOCKER_BASE}/networks/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Name: name, Driver: driver }),
  });
  if (!res.ok) throw new Error(`Failed to create network: ${res.statusText}`);
  return res.json();
}

export async function removeNetwork(id: string): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/networks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to remove network: ${res.statusText}`);
}

export async function tagImage(id: string, repo: string, tag = 'latest'): Promise<void> {
  const res = await fetch(
    `${DOCKER_BASE}/images/${encodeURIComponent(id)}/tag?repo=${encodeURIComponent(repo)}&tag=${encodeURIComponent(tag)}`,
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
    fetch(`${DOCKER_BASE}/containers/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
    fetch(`${DOCKER_BASE}/images/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
    fetch(`${DOCKER_BASE}/networks/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
    fetch(`${DOCKER_BASE}/volumes/prune`, { method: 'POST' }).then((r) => r.json()).catch(() => ({})),
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

  const res = await fetch(`${DOCKER_BASE}/images/${encodeURIComponent(repo)}/push?tag=${encodeURIComponent(tag)}`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) throw new Error(`Push failed: ${res.statusText}`);

  const text = await res.text();
  return text || 'Image pushed successfully to registry.';
}

export function getExportImageTarUrl(imageTag: string): string {
  return `${DOCKER_BASE}/images/${encodeURIComponent(imageTag)}/get`;
}

export async function importImageTar(file: File): Promise<void> {
  const res = await fetch(`${DOCKER_BASE}/images/load`, {
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
  const res = await fetch(`${DOCKER_BASE}/system/df`);
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

  const res = await fetch(`${DOCKER_BASE}/build?t=${encodeURIComponent(tag)}`, {
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

// ─── High-Fidelity Simulation & Mock Datasets ─────────────────────────────────

export const mockDockerSystemInfo: DockerSystemInfo = {
  Containers: 6,
  ContainersRunning: 4,
  ContainersPaused: 1,
  ContainersStopped: 1,
  Images: 8,
  ServerVersion: '25.0.3-ce (Simulated Engine)',
  OperatingSystem: 'Linux x86_64 (MLOps Pipeline Node)',
  NCPU: 8,
  MemTotal: 16 * 1024 * 1024 * 1024,
  DockerRootDir: '/var/lib/docker',
  KernelVersion: '5.15.0-91-generic',
};

export const mockDockerContainers: DockerContainer[] = [
  {
    Id: 'c1a7b8e90f23d456789abcdef0123456789abcdef0123456789abcdef0123456',
    Names: ['/fraud-detection-api'],
    Image: 'ml-org/fraud-detection-api:v2.4',
    Status: 'Up (healthy)',
    State: 'running',
    Ports: [{ IP: '0.0.0.0', PublicPort: 8000, PrivatePort: 8000, Type: 'tcp' }],
    Created: Math.floor(Date.now() / 1000) - 3600,
    SizeRw: 41200000,
    Mounts: [{ Type: 'bind', Source: '/ml_application', Destination: '/app', Mode: 'rw' }],
  },
  {
    Id: 'c2b8c9d01e34f567890abcdef123456789abcdef123456789abcdef123456789',
    Names: ['/fullstack-demo-app'],
    Image: 'devops-org/fullstack-demo-app:v1.0',
    Status: 'Up (healthy)',
    State: 'running',
    Ports: [{ IP: '0.0.0.0', PublicPort: 3000, PrivatePort: 3000, Type: 'tcp' }],
    Created: Math.floor(Date.now() / 1000) - 2400,
    SizeRw: 14500000,
    Mounts: [{ Type: 'bind', Source: '/fullstack_application', Destination: '/app', Mode: 'rw' }],
  },
  {
    Id: 'c3c9d0e12f45a678901bcdef23456789abcdef23456789abcdef23456789abcdef',
    Names: ['/mldevops-dashboard'],
    Image: 'mldevops/control-center:latest',
    Status: 'Up (healthy)',
    State: 'running',
    Ports: [{ IP: '0.0.0.0', PublicPort: 5173, PrivatePort: 80, Type: 'tcp' }],
    Created: Math.floor(Date.now() / 1000) - 7200,
    SizeRw: 22000000,
    Mounts: [{ Type: 'bind', Source: '/frontend', Destination: '/usr/share/nginx/html', Mode: 'ro' }],
  },
  {
    Id: 'c4d0e1f23a56b789012cdef3456789abcdef3456789abcdef3456789abcdef34',
    Names: ['/redis-model-cache'],
    Image: 'redis:7.0-alpine',
    Status: 'Up (healthy)',
    State: 'running',
    Ports: [{ IP: '0.0.0.0', PublicPort: 6379, PrivatePort: 6379, Type: 'tcp' }],
    Created: Math.floor(Date.now() / 1000) - 86400,
    SizeRw: 5120000,
    Mounts: [{ Type: 'volume', Source: 'redis_cache_persist', Destination: '/data', Mode: 'rw' }],
  },
  {
    Id: 'c5e1f2a34b67c890123def456789abcdef456789abcdef456789abcdef456789',
    Names: ['/postgres-ml-features'],
    Image: 'postgres:15-alpine',
    Status: 'Up (healthy)',
    State: 'running',
    Ports: [{ IP: '0.0.0.0', PublicPort: 5432, PrivatePort: 5432, Type: 'tcp' }],
    Created: Math.floor(Date.now() / 1000) - 86400,
    SizeRw: 120400000,
    Mounts: [{ Type: 'volume', Source: 'postgres_feature_store', Destination: '/var/lib/postgresql/data', Mode: 'rw' }],
  },
];

export const mockDockerImages: DockerImage[] = [
  {
    Id: 'sha256:7a4b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    RepoTags: ['ml-org/fraud-detection-api:v2.4'],
    Size: 412000000,
    Created: Math.floor(Date.now() / 1000) - 86400,
    Containers: 1,
    Labels: { maintainer: 'MLOps Pipeline', framework: 'FastAPI / PyTorch' },
  },
  {
    Id: 'sha256:8b5c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c',
    RepoTags: ['devops-org/fullstack-demo-app:v1.0'],
    Size: 145000000,
    Created: Math.floor(Date.now() / 1000) - 86400,
    Containers: 1,
    Labels: { maintainer: 'DevOps Platform', runtime: 'Node.js 20' },
  },
  {
    Id: 'sha256:9c6d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d',
    RepoTags: ['mldevops/control-center:latest'],
    Size: 89000000,
    Created: Math.floor(Date.now() / 1000) - 86400,
    Containers: 1,
    Labels: { maintainer: 'DevOps Platform', framework: 'React / Vite' },
  },
  {
    Id: 'sha256:ad7e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9da0',
    RepoTags: ['redis:7.0-alpine'],
    Size: 33554432,
    Created: Math.floor(Date.now() / 1000) - 86400 * 7,
    Containers: 1,
    Labels: {},
  },
  {
    Id: 'sha256:be8f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9da0b1',
    RepoTags: ['postgres:15-alpine'],
    Size: 397410304,
    Created: Math.floor(Date.now() / 1000) - 86400 * 7,
    Containers: 1,
    Labels: {},
  },
  {
    Id: 'sha256:cf9a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9da0b1c2',
    RepoTags: ['python:3.11-slim'],
    Size: 134217728,
    Created: Math.floor(Date.now() / 1000) - 86400 * 14,
    Containers: 0,
    Labels: {},
  },
  {
    Id: 'sha256:da0b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9da0b1c2d3',
    RepoTags: ['node:20-alpine'],
    Size: 182452224,
    Created: Math.floor(Date.now() / 1000) - 86400 * 14,
    Containers: 0,
    Labels: {},
  },
];

export const mockDockerVolumes: DockerVolume[] = [
  {
    Name: 'ml_model_weights_data',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/ml_model_weights_data/_data',
    CreatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    Labels: { project: 'MLOps-Pipeline', tier: 'persistent' },
  },
  {
    Name: 'postgres_feature_store',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/postgres_feature_store/_data',
    CreatedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    Labels: { project: 'MLOps-Pipeline' },
  },
  {
    Name: 'redis_cache_persist',
    Driver: 'local',
    Mountpoint: '/var/lib/docker/volumes/redis_cache_persist/_data',
    CreatedAt: new Date(Date.now() - 86400000 * 21).toISOString(),
    Labels: {},
  },
];

export const mockDockerNetworks: DockerNetwork[] = [
  {
    Id: 'net_mlops_bridge_01',
    Name: 'mlops-bridge',
    Driver: 'bridge',
    Scope: 'local',
    IPAM: { Config: [{ Subnet: '172.28.0.0/16', Gateway: '172.28.0.1' }] },
    Containers: {
      c1a7b8e90f23d456789abcdef0123456789abcdef0123456789abcdef0123456: {
        Name: 'fraud-detection-api',
        IPv4Address: '172.28.0.2',
      },
      c3c9d0e12f45a678901bcdef23456789abcdef23456789abcdef23456789abcdef: {
        Name: 'redis-model-cache',
        IPv4Address: '172.28.0.3',
      },
    },
  },
  {
    Id: 'net_internal_db_02',
    Name: 'internal-db-network',
    Driver: 'bridge',
    Scope: 'local',
    IPAM: { Config: [{ Subnet: '172.29.0.0/16', Gateway: '172.29.0.1' }] },
    Containers: {
      c4d0e1f23a56b789012cdef3456789abcdef3456789abcdef3456789abcdef34: {
        Name: 'postgres-ml-features',
        IPv4Address: '172.29.0.2',
      },
    },
  },
  {
    Id: 'net_default_bridge_03',
    Name: 'bridge',
    Driver: 'bridge',
    Scope: 'local',
    IPAM: { Config: [{ Subnet: '172.17.0.0/16', Gateway: '172.17.0.1' }] },
    Containers: {},
  },
  {
    Id: 'net_host_04',
    Name: 'host',
    Driver: 'host',
    Scope: 'local',
    IPAM: { Config: [] },
    Containers: {},
  },
];

export const mockDockerDiskUsage: DockerDiskUsage = {
  LayersSize: 3200000000,
  Images: [
    { Size: 432000000, SharedSize: 120000000 },
    { Size: 922746880, SharedSize: 200000000 },
    { Size: 33554432, SharedSize: 0 },
    { Size: 397410304, SharedSize: 50000000 },
  ],
  Containers: [
    { SizeRw: 41200000, SizeRootFs: 473200000 },
    { SizeRw: 88000000, SizeRootFs: 1010746880 },
    { SizeRw: 5120000, SizeRootFs: 38674432 },
  ],
  Volumes: [
    { UsageData: { Size: 1850000000 } },
    { UsageData: { Size: 740000000 } },
    { UsageData: { Size: 42000000 } },
  ],
};

export function getMockContainerLogs(name: string): string {
  const ts = () => new Date().toISOString();
  if (name.includes('fraud-detection')) {
    return [
      `${ts()} [INFO] [uvicorn.error] Started server process [1]`,
      `${ts()} [INFO] [uvicorn.error] Waiting for application startup.`,
      `${ts()} [INFO] [app.main] Loading PyTorch model weights from /models/fraud_v2.4.pt ...`,
      `${ts()} [INFO] [app.main] Model loaded successfully: 48.2M parameters on CUDA:0`,
      `${ts()} [INFO] [uvicorn.error] Application startup complete. Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`,
      `${ts()} [INFO] [api.inference] POST /predict - IP: 172.28.0.1 - 200 OK - Latency: 18.4ms - Result: LEGITIMATE (confidence: 0.998)`,
      `${ts()} [INFO] [api.inference] POST /predict - IP: 172.28.0.1 - 200 OK - Latency: 14.2ms - Result: FRAUD_DETECTED (confidence: 0.942)`,
      `${ts()} [INFO] [api.inference] POST /predict - IP: 172.28.0.1 - 200 OK - Latency: 16.1ms - Result: LEGITIMATE (confidence: 0.985)`,
      `${ts()} [INFO] [metrics.exporter] Prometheus telemetry scraped: 3 requests, avg_latency=16.23ms`,
    ].join('\n');
  }
  if (name.includes('redis')) {
    return [
      `1:M ${ts()} * Running mode=standalone, port=6379.`,
      `1:M ${ts()} # Server initialized`,
      `1:M ${ts()} * Ready to accept connections tcp`,
      `1:M ${ts()} * DB 0: 1,428 keys (0 volatile) in 2,048 slots HT.`,
      `1:M ${ts()} * 1 client connected, 0 clients blocked. Memory used: 4.88M`,
    ].join('\n');
  }
  return [
    `${ts()} [INFO] Initializing container runtime environment...`,
    `${ts()} [INFO] Configuration loaded from environment variables.`,
    `${ts()} [INFO] Listening for connections on designated host port...`,
    `${ts()} [INFO] Service is healthy and processing telemetry requests.`,
  ].join('\n');
}

export function getMockContainerStats(id: string): DockerStats {
  // Generate lively, realistic metrics
  const seed = id.charCodeAt(0) || 50;
  const jitter = Math.sin(Date.now() / 2000) * 12;
  const cpu = Math.max(2.5, Math.min(88, ((seed * 7) % 35) + jitter + 15));
  const memUsage = 180 * 1024 * 1024 + Math.round(jitter * 8 * 1024 * 1024);
  const memLimit = 2048 * 1024 * 1024;
  return {
    cpu_percent: parseFloat(cpu.toFixed(2)),
    memory_usage: memUsage,
    memory_limit: memLimit,
    memory_percent: parseFloat(((memUsage / memLimit) * 100).toFixed(2)),
    network_rx: 2450000 + Math.round(Date.now() % 500000),
    network_tx: 1820000 + Math.round(Date.now() % 350000),
    block_read: 14200000,
    block_write: 3840000,
  };
}

