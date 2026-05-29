import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Alert from '../components/Alert';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Profile() {
  const { username, userId } = useAuth();
  const [managers, setManagers] = useState([]);
  const [profile, setProfile] = useState(null);

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [newManager, setNewManager] = useState({ username: '', password: '', confirmPassword: '' });

  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [createMsg, setCreateMsg] = useState({ type: '', text: '' });
  const [listMsg, setListMsg] = useState({ type: '', text: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const loadManagers = async () => {
    try {
      const [usersRes, meRes] = await Promise.all([api.get('/users'), api.get('/users/me')]);
      setManagers(usersRes.data);
      setProfile(meRes.data);
    } catch {
      setListMsg({ type: 'error', text: 'Could not load manager accounts.' });
    }
  };

  useEffect(() => {
    loadManagers();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setPwdLoading(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setCreateMsg({ type: '', text: '' });
    if (newManager.password !== newManager.confirmPassword) {
      setCreateMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setCreateLoading(true);
    try {
      await api.post('/users', {
        username: newManager.username,
        password: newManager.password,
      });
      setCreateMsg({ type: 'success', text: `Manager "${newManager.username}" created.` });
      setNewManager({ username: '', password: '', confirmPassword: '' });
      loadManagers();
    } catch (err) {
      setCreateMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create manager.' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete manager account "${name}"? This cannot be undone.`)) return;
    setListMsg({ type: '', text: '' });
    try {
      await api.delete(`/users/${id}`);
      setListMsg({ type: 'success', text: `Manager "${name}" deleted.` });
      loadManagers();
    } catch (err) {
      setListMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete manager.' });
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-RW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tableRows = managers.map((m) => {
    const isSelf = m.userId === userId;
    const deleteBtn = !isSelf ? (
      <button
        type="button"
        className="btn-danger w-full sm:w-auto"
        onClick={() => handleDelete(m.userId, m.username)}
      >
        Delete
      </button>
    ) : (
      <span className="text-xs font-medium text-brand-600">You</span>
    );

    return {
      cells: [
        m.username,
        formatDate(m.createdAt),
        isSelf ? (
          <span className="inline-flex rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800">
            Current account
          </span>
        ) : (
          <span className="text-slate-500">Manager</span>
        ),
        !isSelf ? <span className="hidden md:inline">{deleteBtn}</span> : <span className="hidden md:inline text-slate-400">—</span>,
      ],
      actions: !isSelf ? deleteBtn : undefined,
    };
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Profile"
        description="Manage your password and store manager accounts for StockHub Ltd."
      />

      <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
            {(username || 'M').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-slate-900">{username}</p>
            <p className="text-sm text-slate-600">Store Manager · ID #{profile?.userId ?? userId}</p>
            <p className="text-xs text-slate-500">Member since {formatDate(profile?.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleChangePassword} className="card">
          <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Change password</h2>
          <p className="mb-4 text-sm text-slate-500">Update your login password.</p>
          <div className="mb-4 space-y-3">
            <Alert type={pwdMsg.type} message={pwdMsg.text} />
            <div>
              <label className="field-label">Current password</label>
              <input
                type="password"
                className="input-field"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="field-label">New password</label>
              <input
                type="password"
                className="input-field"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="field-label">Confirm new password</label>
              <input
                type="password"
                className="input-field"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pwdLoading}>
            {pwdLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <form onSubmit={handleCreateManager} className="card">
          <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">Create manager</h2>
          <p className="mb-4 text-sm text-slate-500">Add another store manager account.</p>
          <div className="mb-4 space-y-3">
            <Alert type={createMsg.type} message={createMsg.text} />
            <div>
              <label className="field-label">Username</label>
              <input
                className="input-field"
                value={newManager.username}
                onChange={(e) => setNewManager({ ...newManager, username: e.target.value })}
                placeholder="e.g. jane_manager"
                required
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="input-field"
                value={newManager.password}
                onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="field-label">Confirm password</label>
              <input
                type="password"
                className="input-field"
                value={newManager.confirmPassword}
                onChange={(e) => setNewManager({ ...newManager, confirmPassword: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={createLoading}>
            {createLoading ? 'Creating…' : 'Create manager account'}
          </button>
        </form>
      </div>

      <div className="card mt-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-slate-900">All managers</h2>
        <p className="mb-4 text-sm text-slate-500">
          {managers.length} registered manager{managers.length !== 1 ? 's' : ''}. You cannot delete your own account while signed in.
        </p>
        <Alert type={listMsg.type} message={listMsg.text} />
        <div className="mt-4">
          <ResponsiveTable
            headers={['Username', 'Joined', 'Role', 'Actions']}
            rows={tableRows}
            emptyMessage="No managers found."
            rowKey={(row, i) => managers[i]?.userId}
          />
        </div>
      </div>
    </div>
  );
}
