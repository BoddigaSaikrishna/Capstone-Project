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
    if (res.status === 0 || res.type === 'opaque') {
      throw new Error('Docker Engine is unreachable. Enable TCP on localhost:2375.');
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

// ─── Volumes ──────────────────────────────────────────────────────────────────

export async function fetchDockerVolumes(): Promise<DockerVolume[]> {
  const res = await fetch(`${DOCKER_BASE}/volumes`);
  if (!res.ok) throw new Error(`Failed to fetch volumes: ${res.statusText}`);
  const data = await res.json();
  return data.Volumes ?? [];
}

// ─── Networks ─────────────────────────────────────────────────────────────────

export async function fetchDockerNetworks(): Promise<DockerNetwork[]> {
  const res = await fetch(`${DOCKER_BASE}/networks`);
  if (!res.ok) throw new Error(`Failed to fetch networks: ${res.statusText}`);
  return res.json();
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
