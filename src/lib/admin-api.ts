// Admin User Management API helpers

export interface ManagedUser {
  id: number;
  username: string;
  role: 'SUPER_ADMIN' | 'AGENT_VIEWER';
  site_uuid: string | null;
  agent_uuid: string | null;
  account_name: string | null;
  profile_picture: string | null;
  created_at: string;
}

export interface ViewAsStatus {
  active: boolean;
  agent_uuid?: string;
  agent_label?: string;
  token?: string;
}

// ─── localStorage key untuk view-as state ─────────────────────────────────────
const VIEW_AS_KEY = 'backone_view_as';

// Ambil view-as token dari localStorage (berjalan hanya di browser)
export function getViewAsToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(VIEW_AS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch { return null; }
}

// Ambil view-as status dari localStorage
export function getViewAsStatusSync(): ViewAsStatus {
  if (typeof window === 'undefined') return { active: false };
  try {
    const stored = localStorage.getItem(VIEW_AS_KEY);
    if (!stored) return { active: false };
    return JSON.parse(stored);
  } catch { return { active: false }; }
}

// GET /api/auth/admin/users
export async function getAdminUsers(): Promise<ManagedUser[]> {
  const res = await fetch('/api/auth/admin/users', { credentials: 'include' });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to retrieve user list');
  return json.data;
}

// POST /api/auth/admin/create-agent-user
export async function createAdminAgentUser(data: {
  username: string;
  password: string;
  account_name?: string;
  agent_uuid?: string;
}): Promise<{ ok: boolean; message: string; userId: number }> {
  const res = await fetch('/api/auth/admin/create-agent-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to create account');
  return json;
}

// POST /api/auth/admin/update-agent-user (FormData)
export async function updateAdminAgentUser(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const res = await fetch('/api/auth/admin/update-agent-user', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to update account');
  return json;
}

// DELETE /api/auth/admin/delete-agent-user/:id
export async function deleteAdminAgentUser(userId: number): Promise<void> {
  const res = await fetch('/api/auth/admin/delete-agent-user/' + userId, {
    method: 'DELETE',
    credentials: 'include',
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to delete account');
}

// POST /api/auth/admin/view-as — simpan token di localStorage
export async function startViewAs(agent_uuid: string, agent_label: string): Promise<void> {
  const res = await fetch('/api/auth/admin/view-as', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ agent_uuid, agent_label }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}): Backend mungkin perlu di-restart`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to enter view-as mode');

  // Simpan token di localStorage — akan dikirim sebagai X-View-As-Agent header
  if (typeof window !== 'undefined') {
    localStorage.setItem(VIEW_AS_KEY, JSON.stringify({
      active: true,
      agent_uuid: json.agent_uuid,
      agent_label: json.agent_label,
      token: json.view_token,
    }));
  }
}

// Keluar dari mode view-as — hapus dari localStorage dan server session
export async function stopViewAs(): Promise<void> {
  try {
    await fetch('/api/auth/admin/view-as', {
      method: 'DELETE',
      credentials: 'include'
    });
  } catch (err) {
    console.error('Failed to terminate server view-as session:', err);
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(VIEW_AS_KEY);
  }
}

// GET view-as status (dari localStorage, bukan server)
export async function getViewAsStatus(): Promise<ViewAsStatus> {
  return getViewAsStatusSync();
}

// Buat headers untuk fetch yang menyertakan X-View-As-Agent jika aktif
export function getViewAsHeaders(): Record<string, string> {
  const token = getViewAsToken();
  if (!token) return {};
  return { 'X-View-As-Agent': token };
}

// Resolusi label agent dari daftar users (account_name) atau fallback ke uuid
export function resolveAgentLabel(agentUuid: string, users: ManagedUser[]): string {
  const user = users.find(u => u.agent_uuid === agentUuid && u.role === 'AGENT_VIEWER');
  return user?.account_name || agentUuid;
}

