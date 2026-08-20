import { updateAdminAgentUser, createAdminExternalUser } from "@/lib/admin-api";

export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function submitExternalAccountForm({
  user,
  username,
  password,
  accountName,
  role,
  selectedAgents,
  finalCompany,
  picFile,
}: {
  user?: any;
  username: string;
  password?: string;
  accountName: string;
  role: string;
  selectedAgents: string[];
  finalCompany: string;
  picFile: File | null;
}) {
  const isEdit = !!user;
  if (isEdit) {
    const payload: Record<string, any> = {
      user_id: String(user.id),
      account_name: accountName.trim(),
      agent_uuids: selectedAgents,
    };
    if (username.trim()) payload.username = username.trim();
    if (password) payload.password = password;
    if (finalCompany) payload.company_name = finalCompany;

    await updateAdminAgentUser(payload);

    if (picFile) {
      const base64 = await fileToBase64(picFile);
      await fetch('/api/auth/upload-profile-picture', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_picture_base64: base64, user_id: String(user.id) }),
      });
    }

    return password ? "Password successfully reset & Account updated!" : "Account successfully updated!";
  } else {
    const payload: Record<string, any> = {
      role,
      agent_uuids: selectedAgents,
    };
    if (username.trim()) payload.username = username.trim();
    if (password) payload.password = password;
    if (accountName.trim()) payload.account_name = accountName.trim();
    if (finalCompany) payload.company_name = finalCompany;

    const createResult = await createAdminExternalUser(payload);

    if (picFile && createResult.userId) {
      const base64 = await fileToBase64(picFile);
      await fetch('/api/auth/upload-profile-picture', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_picture_base64: base64, user_id: createResult.userId }),
      });
    }

    return "External account successfully created!";
  }
}
