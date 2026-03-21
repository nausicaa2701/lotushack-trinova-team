import { motion } from 'motion/react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Link, useNavigate } from 'react-router-dom';
import { Clock3, Leaf, Lock, Mail, Zap } from 'lucide-react';
import { useAuth, type UserRole } from '../auth/AuthContext';
import { useMockData } from '../hooks/useMockData';
import type { PlatformUser } from '../lib/platformMock';
import { getApiBase } from '../lib/apiClient';

function mapRemoteUserToAuth(
  raw: { id: string; name: string; email: string; roles: string[]; defaultRole?: string },
  enrich: PlatformUser
) {
  const roles = raw.roles.filter((r): r is UserRole => r === 'owner' || r === 'provider' || r === 'admin');
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    roles: roles.length ? roles : enrich.roles,
    defaultRole: (raw.defaultRole as UserRole | undefined) ?? enrich.defaultRole,
    providerAccountId: enrich.providerAccountId,
    vehicle: enrich.vehicle,
    vehiclePlate: enrich.vehiclePlate,
    branch: enrich.branch,
    title: enrich.title,
  };
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { data, loading, error } = useMockData();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const users = data?.users ?? [];

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const found = users.find((item) => item.id === selectedUserId);
    if (!found) {
      setSubmitError('Please choose a user.');
      return;
    }

    const loginEmail = email.trim() || found.email;

    setSubmitting(true);
    fetch(`${getApiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail,
        password: password || 'demo-password',
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Login failed');
        }
        return response.json() as Promise<{
          user: { id: string; name: string; email: string; roles: string[]; defaultRole?: string };
        }>;
      })
      .then((result) => {
        const nextRole = login(mapRemoteUserToAuth(result.user, found));
        navigate(`/${nextRole}/dashboard`);
      })
      .catch(() => {
        setSubmitError('Sign-in service is unavailable. Continuing with the selected demo profile.');
        const nextRole = login({
          id: found.id,
          name: found.name,
          email: found.email,
          roles: found.roles,
          defaultRole: found.defaultRole,
          providerAccountId: found.providerAccountId,
          vehicle: found.vehicle,
          vehiclePlate: found.vehiclePlate,
          branch: found.branch,
          title: found.title,
        });
        navigate(`/${nextRole}/dashboard`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <main className="flex min-h-screen min-h-dvh overflow-hidden bg-surface">
      {/* Left Side: Login Form */}
      <section className="relative z-10 flex w-full flex-col justify-center bg-surface-bright px-6 pb-16 pt-24 sm:px-8 md:px-12 lg:w-1/2 lg:px-20 lg:py-20">
        <div className="absolute left-6 top-8 sm:left-8 md:left-12 lg:left-20 lg:top-12">
          <Link to="/" className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">WashNet</Link>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto space-y-8"
        >
          <div className="space-y-2">
            <p className="text-on-surface-variant font-medium">Access your premium EV wash dashboard.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-sm font-semibold text-on-surface-variant" htmlFor="demo-profile">
                  Demo profile
                </label>
                <select
                  id="demo-profile"
                  className="w-full rounded-2xl border-none bg-surface-container-highest px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-primary"
                  value={selectedUserId}
                  onChange={(evt) => setSelectedUserId(evt.target.value)}
                  disabled={loading || Boolean(error)}
                >
                  {loading && <option>Loading users...</option>}
                  {error && <option>Failed to load users</option>}
                  {!loading && !error && users.length === 0 && <option>No users found</option>}
                  {users.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.roles.join(' / ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-outline" />
                  <input
                    id="email" 
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-2xl focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                  <Link className="text-xs font-bold text-primary hover:underline" to="/">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-outline" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-surface-container-highest border-none rounded-2xl focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary transition-all duration-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{submitError}</p>
            )}

            <Button 
              label="Login to Dashboard" 
              className="w-full py-4 px-6 power-gradient text-white font-headline font-bold rounded-full hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 border-none"
              disabled={loading || Boolean(error) || users.length === 0 || submitting}
            />
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-outline-variant/20"></div>
            <span className="flex-shrink mx-4 text-outline text-xs font-bold tracking-widest uppercase">Or continue with</span>
            <div className="flex-grow border-t border-outline-variant/20"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" disabled title="Social login is planned post-MVP" className="flex items-center justify-center gap-3 py-3 px-4 bg-surface-container-low rounded-full border border-outline-variant/10 text-slate-400 font-semibold text-sm">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3ZqmtS--SZgoAxdj8WtkURIg_XfSJcLu3Mq5YJPGiIs2QCpUbA8kkwVnrWVnrP4BarBlCG5G7EIXabs17PNmbhm3_HabcNEOBCA94hhvgTzNfjAgcPwbz2nUYQHTZhz0p96Q0JV4IajDXbZ7PCr51jTYNkVFTpY2gsk1qKPD82_gu8kSKmMWinwDjrNRTAzDMqySQEl0ngs8vD5ArBfCndrDR4lLcnBgOZL_Lj9V6-sp9Moy2U4GZVtUZXsy-E18Tvupo1dcdG52J" 
                alt="Google" 
                className="w-5 h-5"
                referrerPolicy="no-referrer"
              />
              Google
            </button>
            <button type="button" disabled title="Social login is planned post-MVP" className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-300 text-white rounded-full font-semibold text-sm">
              <i className="pi pi-apple text-xl"></i>
              Apple
            </button>
          </div>

          <p className="text-center text-on-surface-variant text-sm font-medium">
            Don't have an account? 
            <Link className="text-primary font-bold hover:underline ml-1" to="/">Sign Up</Link>
          </p>
        </motion.div>

        <div className="absolute bottom-8 left-0 hidden w-full text-center lg:block">
          <p className="text-[10px] uppercase tracking-widest text-outline font-bold">Precision Fluidity © 2024 WashNet</p>
        </div>
      </section>

      {/* Right Side: Brand Imagery */}
      <section className="hidden lg:flex w-1/2 relative bg-surface-container overflow-hidden">
        <img 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuABmUjavJh2bKK8YnmFS_TU0mlAPW19pNmMp97VAb6hmA14A9uemhn_VUPkpzmaNudrOdgHWj2s853r10IJ_twJ0nK3AOrfDZ96LjEwhtn9eEIyyxdA2qr7X7eK74w3rnMyrr0qfmKppjNWWKm1aItaNvlU3rPjnHx7btI5CgAl2sRHWqQxWqKau1aZEQgIMK66LkDCnfabHTQzhHrIjNCzwN3HPDlsLtU5pht38-5m2qxVVHRr5o7wy6aF4TmoLzSzrS_4gQp2YZw8" 
          alt="Modern EV in garage" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-20 w-full text-white">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/10 p-10 rounded-[2rem] border border-white/10 space-y-6 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed rounded-sm text-on-tertiary-fixed text-[10px] font-bold tracking-widest uppercase">
              <Zap className="h-3.5 w-3.5" />
              Premium Performance
            </div>
            <h2 className="font-headline text-4xl font-extrabold leading-tight">Your car deserves the sanctuary of a precise clean.</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Leaf className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Sustainable Engineering</h3>
                  <p className="text-white/70 text-sm">90% less water usage than traditional bay washes with zero-waste filtration.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Predictive Scheduling</h3>
                  <p className="text-white/70 text-sm">Our AI monitors your local weather and driving habits to suggest the perfect wash time.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

      </section>
    </main>
  );
}
