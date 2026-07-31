// Admin User Management API helpers

export interface ManagedUser {
  id: number;
  username: string;
  role: 'SUPER_ADMIN' | 'EXECUTIVE' | 'AGENT_VIEWER' | 'SOC_ANALYST' | 'ENGINEER' | 'TENANT_ADMIN' | string;
  site_uuid: string | null;
  agent_uuid: string | null;
  company_name?: string | null;
  agent_uuids?: string[];
  account_name: string | null;
  profile_picture: string | null;
  created_at: string;
}

export interface ViewAsStatus {
  active: boolean;
  agent_uuid?: string;
  agent_label?: string;  // Label agent (dari registry)
  token?: string;
  view_as_type?: 'user' | 'agent'; // 'user' = view-as user tertentu, 'agent' = direct agent view
  user_name?: string;   // Nama user yang di-view (hanya untuk view_as_type='user')
  user_role?: string;   // Role user yang di-view (hanya untuk view_as_type='user')
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

// POST /api/auth/admin/create-external-user (FormData)
export async function createAdminExternalUser(formData: FormData): Promise<{ ok: boolean; message: string; userId: string }> {
  const res = await fetch('/api/auth/admin/create-external-user', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to create external account');
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

// POST /api/auth/admin/view-as — simpan token di localStorage (direct agent view-as)
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
      agent_label: json.agent_label,   // Label agent dari registry
      token: json.view_token,
      view_as_type: 'agent',           // Direct agent view-as
    }));
  }
}

// POST /api/auth/admin/view-as — view-as USER tertentu (COMPANY_ADMIN → OPERATOR/VIEWER)
// userName: nama user yang di-view, userRole: role user, agentUuid: agent pertama user, agentLabel: label agent dari registry
export async function startViewAsUser(
  agentUuid: string,
  agentLabel: string,
  userName: string,
  userRole: string,
  targetUserId?: number | string
): Promise<void> {
  const labelForToken = `${userName} (${userRole.replace(/_/g, ' ')})`;
  const res = await fetch('/api/auth/admin/view-as', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      agent_uuid: agentUuid,
      agent_label: labelForToken,
      target_user_id: targetUserId || undefined,
      target_username: userName,
      target_role: userRole
    }),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}): Backend mungkin perlu di-restart`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Failed to enter view-as mode');

  // Simpan token di localStorage dengan konteks user yang lebih kaya
  if (typeof window !== 'undefined') {
    localStorage.setItem(VIEW_AS_KEY, JSON.stringify({
      active: true,
      agent_uuid: json.agent_uuid,
      agent_label: agentLabel,         // Label AGENT dari registry (bukan nama user)
      token: json.view_token,
      view_as_type: 'user',            // User view-as mode
      user_name: userName,             // Nama user yang di-view
      user_role: userRole,             // Role user yang di-view
      targetUserId: targetUserId || json.target_user_id
    }));
  }
}


// Hapus penuh state view-as di browser
export function clearViewAsState(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(VIEW_AS_KEY);
  }
}

// Validasi apakah role user saat ini diizinkan menggunakan mode view-as
export function validateViewAsSession(currentUserRole?: string): ViewAsStatus {
  const status = getViewAsStatusSync();
  if (!status.active) return { active: false };

  const allowedRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'COMPANY_OPERATOR'];
  if (currentUserRole && !allowedRoles.includes(currentUserRole)) {
    clearViewAsState();
    return { active: false };
  }
  return status;
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

  clearViewAsState();
}

// GET view-as status (dari localStorage, bukan server)
export async function getViewAsStatus(): Promise<ViewAsStatus> {
  return getViewAsStatusSync();
}

// Buat headers untuk fetch yang menyertakan X-View-As-Agent jika aktif
export function getViewAsHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (typeof window !== 'undefined') {
    const token = getViewAsToken();
    if (token) headers['X-View-As-Agent'] = token;
    const siteUuid = localStorage.getItem('backone_site_uuid') || '6681452d_9cae_4ff4_8ae8_0d504774265e';
    headers['x-backone-site-uuid'] = siteUuid;
  }
  
  return headers;
}

// Resolusi label agent dari daftar users (account_name) atau fallback ke uuid
export function resolveAgentLabel(agentUuid: string, users: ManagedUser[]): string {
  const user = users.find(u => u.agent_uuid === agentUuid && u.role === 'AGENT_VIEWER');
  return user?.account_name || agentUuid;
}

