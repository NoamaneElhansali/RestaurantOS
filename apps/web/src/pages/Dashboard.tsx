import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthProvider';
import { ApiError, identity, type RestaurantMembership, type Role } from '../lib/api';

function readableError(error: unknown): string {
  if (error instanceof ApiError) return Object.values(error.errors)[0]?.[0] ?? error.message;
  return 'Unable to complete the request.';
}

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useQueryClient();
  const { user, refresh } = useAuth();
  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<Role>('waiter');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const restaurants = useQuery({ queryKey: ['restaurants'], queryFn: identity.restaurants });
  const active = useQuery({ queryKey: ['active-restaurant'], queryFn: identity.active });
  const id = active.data?.restaurant?.id;
  const details = useQuery({ queryKey: ['restaurant', id], queryFn: () => identity.restaurant(id!), enabled: !!id });
  const role = details.data?.role;
  const members = useQuery({ queryKey: ['members', id], queryFn: () => identity.members(id!), enabled: !!id && role === 'owner' });

  async function action(fn: () => Promise<unknown>) {
    setBusy(true); setError(''); setSuccess('');
    try {
      await fn();
      await client.invalidateQueries({ queryKey: ['restaurants'] });
      await client.invalidateQueries({ queryKey: ['active-restaurant'] });
      await client.invalidateQueries({ queryKey: ['restaurant'] });
      await client.invalidateQueries({ queryKey: ['members'] });
      setSuccess(t('phase2.saved'));
    } catch (exception) { setError(readableError(exception)); }
    finally { setBusy(false); }
  }

  async function createRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await action(async () => {
      const { restaurant } = await identity.createRestaurant(newName);
      await identity.switchRestaurant(restaurant.id);
      setNewName('');
    });
  }

  async function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    await action(() => identity.renameRestaurant(id, editingName));
    setEditingName('');
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    await action(() => identity.addMember(id, staffEmail, staffRole));
    setStaffEmail('');
  }

  async function logout() {
    await action(async () => {
      await identity.logout();
      client.removeQueries({ queryKey: ['restaurants'] });
      client.removeQueries({ queryKey: ['active-restaurant'] });
      await refresh();
      navigate('/login', { replace: true });
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rs-border pb-8">
        <div><p className="text-sm text-rs-muted">{t('phase2.workspace')}</p><h1 className="mt-1 text-3xl font-bold">{t('phase2.dashboardTitle')}</h1><p className="mt-2">{t('phase2.welcome', { name: user?.name })}</p></div>
        <Button variant="subtle" onClick={() => void logout()} disabled={busy}>{t('phase2.logout')}</Button>
      </div>
      {error && <p role="alert" className="my-5 rounded-xl bg-rs-error-bg p-4 text-rs-error-text">{error}</p>}
      {success && <p role="status" className="my-5 rounded-xl bg-rs-success-bg p-4 text-rs-success-text">{success}</p>}
      {restaurants.isPending || active.isPending ? <p role="status" className="mt-8">{t('phase2.loadingRestaurants')}</p> : restaurants.isError || active.isError ? <p role="alert" className="mt-8">Unable to load restaurants. <button type="button" onClick={() => { void restaurants.refetch(); void active.refetch(); }} className="underline">{t('phase2.retry')}</button></p> :
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-rs-card-border bg-white p-6">
              <h2 className="text-xl font-semibold">{t('phase2.restaurantsTitle')}</h2>
              {restaurants.data?.restaurants.length === 0 && <p className="mt-3 text-sm text-rs-muted">{t('phase2.noRestaurants')}</p>}
              <ul className="mt-5 space-y-3">
                {restaurants.data?.restaurants.map((restaurant: RestaurantMembership) => (
                  <li key={restaurant.id} className="flex items-center justify-between gap-3 rounded-xl border border-rs-line p-3">
                    <div><strong className="block">{restaurant.name}</strong><span className="text-xs capitalize text-rs-muted">{restaurant.role.replace('_', ' ')}</span></div>
                    <Button variant="subtle" disabled={busy || restaurant.id === id} onClick={() => void action(() => identity.switchRestaurant(restaurant.id))}>{restaurant.id === id ? t('phase2.selected') : t('phase2.select')}</Button>
                  </li>
                ))}
              </ul>
            </section>
            <form onSubmit={(e) => void createRestaurant(e)} className="rounded-2xl border border-rs-card-border bg-white p-6">
              <h2 className="text-xl font-semibold">{t('phase2.createRestaurant')}</h2>
              <label className="mt-4 block text-sm font-medium">Restaurant name
                <input className="auth-input" required minLength={2} maxLength={160} value={newName} onChange={(e) => setNewName(e.target.value)} />
              </label>
              <Button className="mt-5" type="submit" disabled={busy}>{t('phase2.create')}</Button>
            </form>
          </div>
          <section className="rounded-2xl border border-rs-card-border bg-white p-6">
            {!id ? <p>{t('phase2.selectPrompt')}</p> : details.isPending ? <p role="status">{t('phase2.loadingDetails')}</p> : details.isError ? <p role="alert">{t('phase2.accessRevoked')}</p> :
              <>
                <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-rs-muted">{t('phase2.activeRestaurant')}</p><h2 className="mt-2 text-2xl font-semibold">{details.data?.restaurant.name}</h2><p className="mt-1 text-sm capitalize">{role?.replace('_', ' ')}</p></div><Link className="text-sm underline" to="/">{t('phase2.platformStatus')}</Link></div>
                {(role === 'owner' || role === 'manager') && <form onSubmit={(e) => void rename(e)} className="mt-7 border-t border-rs-border pt-5">
                  <h3 className="font-semibold">{t('phase2.updateDetails')}</h3>
                  <label className="mt-3 block text-sm">{t('phase2.newName')} <input className="auth-input" minLength={2} maxLength={160} value={editingName} onChange={(e) => setEditingName(e.target.value)} required /></label>
                  <Button type="submit" className="mt-3" disabled={busy}>{t('phase2.saveName')}</Button>
                </form>}
                {role === 'owner' && <div className="mt-8 border-t border-rs-border pt-5">
                  <h3 className="font-semibold">{t('phase2.staffTitle')}</h3>
                  {members.isPending ? <p role="status" className="mt-3">{t('phase2.loadingMembers')}</p> : members.isError ? <p role="alert" className="mt-3">{t('phase2.membersError')}</p> : <ul className="mt-3 space-y-2">{members.data?.members.map((member) => <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rs-line p-3"><span>{member.user.name} <span className="text-sm text-rs-muted">({member.role})</span></span><Button variant="subtle" disabled={busy} onClick={() => void action(() => identity.removeMember(id, member.id))}>{t('phase2.remove')}</Button></li>)}</ul>}
                  <form onSubmit={(e) => void addMember(e)} className="mt-6 space-y-3">
                    <label className="block text-sm">{t('phase2.existingEmail')} <input className="auth-input" type="email" required value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} /></label>
                    <label className="block text-sm">{t('phase2.role')}
                      <select className="auth-input" value={staffRole} onChange={(e) => setStaffRole(e.target.value as Role)}>
                        {(['owner', 'manager', 'waiter', 'kitchen_staff', 'menu_editor'] as Role[]).map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
                      </select>
                    </label>
                    <Button type="submit" disabled={busy}>{t('phase2.addMember')}</Button>
                  </form>
                </div>}
              </>
            }
          </section>
        </div>
      }
    </main>
  );
}
