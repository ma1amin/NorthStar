import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, ArrowLeft, Loader2, Search, ShieldCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const roles = ["user", "moderator", "admin"] as const;

export default function AdminUsers() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const isAdmin = isAuthenticated && user?.role === "admin";
  const { data: users, isLoading, isError, refetch } = trpc.moderation.listUsers.useQuery({ limit: 50, offset: 0 }, { enabled: isAdmin });
  const setUserRole = trpc.moderation.setUserRole.useMutation({
    onSuccess: () => { toast.success("User role updated and recorded in moderation history"); refetch(); },
    onError: (error) => toast.error(error.message || "Unable to update user role"),
  });
  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users ?? [];
    return (users ?? []).filter((entry) => `${entry.name ?? ""} ${entry.email ?? ""} ${entry.role}`.toLowerCase().includes(normalized));
  }, [query, users]);

  if (!isAdmin) return <div className="min-h-screen bg-slate-50 py-12"><div className="container max-w-2xl"><Card className="p-8 text-center shadow-sm"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" /><h1 className="text-2xl font-bold text-slate-950">Administrator access required</h1><p className="mt-2 text-slate-600">Only administrators can manage roles and user access.</p><Button className="mt-6 bg-sky-600 text-white hover:bg-sky-700" onClick={() => setLocation("/admin")}>Return to moderation</Button></Card></div></div>;

  return <div className="min-h-screen bg-slate-50 py-8 md:py-12"><div className="container max-w-5xl"><Button variant="ghost" onClick={() => setLocation("/admin")} className="mb-5 -ml-3 text-slate-600 hover:text-slate-950"><ArrowLeft className="mr-2 h-4 w-4" /> Moderation dashboard</Button><header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Administrator controls</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">User management</h1><p className="mt-3 max-w-2xl text-slate-600">Assign moderation roles deliberately. Role changes are recorded in the moderation history for accountability.</p></div><Badge className="w-fit bg-sky-100 px-3 py-1.5 text-sky-800 hover:bg-sky-100"><ShieldCheck className="mr-1.5 h-4 w-4" /> Admin-only</Badge></header><Card className="overflow-hidden bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Users className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-950">Platform users</h2><p className="text-sm text-slate-600">Review access roles for the current account set.</p></div></div><label className="relative block w-full sm:max-w-xs"><span className="sr-only">Search users</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" /></label></div>{isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div> : isError ? <div role="alert" className="p-10 text-center"><AlertCircle className="mx-auto mb-4 h-11 w-11 text-red-500" /><h2 className="font-semibold text-slate-950">Unable to load users</h2><p className="mt-2 text-sm text-slate-600">Refresh the page to try again.</p></div> : filteredUsers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">NorthStar user accounts and assigned roles.</caption><thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"><tr><th scope="col" className="px-5 py-3">User</th><th scope="col" className="px-5 py-3">Reputation</th><th scope="col" className="px-5 py-3">Joined</th><th scope="col" className="px-5 py-3">Role</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredUsers.map((entry) => <tr key={entry.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-medium text-slate-950">{entry.name || "Unnamed user"}</p><p className="mt-0.5 text-slate-500">{entry.email || `User #${entry.id}`}</p></td><td className="px-5 py-4 text-slate-600">{entry.reputation}</td><td className="px-5 py-4 text-slate-600"><time dateTime={new Date(entry.createdAt).toISOString()}>{new Date(entry.createdAt).toLocaleDateString()}</time></td><td className="px-5 py-4"><select aria-label={`Role for ${entry.name || `user ${entry.id}`}`} value={entry.role} disabled={entry.id === user?.id || setUserRole.isPending} onChange={(event) => setUserRole.mutate({ userId: entry.id, role: event.target.value as (typeof roles)[number] })} className="h-9 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium capitalize text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60">{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select>{entry.id === user?.id && <p className="mt-1 text-xs text-slate-500">Your own role is locked.</p>}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><Users className="mx-auto mb-4 h-12 w-12 text-slate-300" /><h2 className="font-semibold text-slate-950">No matching users</h2><p className="mt-2 text-sm text-slate-600">Try a broader user search.</p></div>}</Card></div></div>;
}
