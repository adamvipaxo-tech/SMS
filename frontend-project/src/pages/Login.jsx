import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.token, data.username, data.userId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials and server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        <div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Stock Management
            <span className="block text-brand-400">System</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-400">
            Digital inventory for StockHub Ltd — wholesale & retail distribution in Kigali City, Rwanda.
          </p>
        </div>
        <p className="text-sm text-slate-500">National Practical Exam 2026 · SMS</p>
      </div>

      <div className="flex w-full min-h-[50vh] flex-col justify-center px-4 py-10 sm:min-h-0 sm:px-12 lg:w-1/2 lg:px-16 lg:py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="font-display text-2xl font-bold text-slate-900">StockHub SMS</p>
            <p className="text-sm text-slate-500">Kigali City, Rwanda</p>
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900">Store manager login</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your username and password to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="username"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. manager"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Default account after DB setup: <strong className="text-slate-700">manager</strong> /{' '}
            <strong className="text-slate-700">manager123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
