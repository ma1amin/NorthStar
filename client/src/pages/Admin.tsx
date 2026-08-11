import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2, Network } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

const relationshipLabels: Record<string, string> = {
  alternative_to: "Alternative To",
  similar_to: "Similar To",
  integrates_with: "Integrates With",
  built_by: "Built By",
  depends_on: "Depends On",
  part_of: "Part Of",
  competitor_of: "Competitor Of",
};

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("submissions");
  const isAdmin = isAuthenticated && (user?.role === "admin" || user?.role === "moderator");
  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = trpc.moderation.getPendingSubmissions.useQuery({ limit: 50, offset: 0 }, { enabled: isAdmin });
  const { data: relationships, isLoading: relationshipsLoading, refetch: refetchRelationships } = trpc.moderation.getPendingRelationships.useQuery({ limit: 50, offset: 0 }, { enabled: isAdmin });
  const approveSubmission = trpc.moderation.approveSubmission.useMutation({ onSuccess: () => { toast.success("Submission approved"); refetchSubmissions(); } });
  const rejectSubmission = trpc.moderation.rejectSubmission.useMutation({ onSuccess: () => { toast.success("Submission rejected"); refetchSubmissions(); } });
  const approveRelationship = trpc.relationships.approve.useMutation({ onSuccess: () => { toast.success("Relationship approved"); refetchRelationships(); } });
  const rejectRelationship = trpc.moderation.rejectRelationship.useMutation({ onSuccess: () => { toast.success("Relationship rejected"); refetchRelationships(); } });

  if (!isAdmin) {
    return <div className="min-h-screen bg-slate-50 py-12"><div className="container max-w-2xl"><Card className="p-8 text-center shadow-sm"><AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" /><h1 className="mb-2 text-2xl font-bold text-slate-950">Access Denied</h1><p className="mb-6 text-slate-600">You need moderator privileges to access the moderation dashboard.</p><Button onClick={() => setLocation("/")} className="bg-sky-600 text-white hover:bg-sky-700">Go to Home</Button></Card></div></div>;
  }

  return <div className="min-h-screen bg-slate-50 py-8 md:py-12"><div className="container max-w-6xl"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Human oversight</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Moderation dashboard</h1><p className="mt-3 max-w-2xl text-slate-600">Review resource submissions and graph suggestions before they become part of NorthStar’s public knowledge layer.</p></div><Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full"><TabsList className="grid h-auto w-full grid-cols-2 bg-white p-1 shadow-sm"><TabsTrigger value="submissions" className="gap-2 py-3"><AlertCircle className="h-4 w-4" /> Submissions ({submissions?.length || 0})</TabsTrigger><TabsTrigger value="relationships" className="gap-2 py-3"><Network className="h-4 w-4" /> Relationships ({relationships?.length || 0})</TabsTrigger></TabsList><TabsContent value="submissions" className="mt-5">{submissionsLoading ? <LoadingState /> : submissions && submissions.length > 0 ? <div className="grid gap-4">{submissions.map((submission: any) => <Card key={submission.id} className="border-l-4 border-l-amber-500 bg-white p-6 shadow-sm"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]"><div><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{submission.title}</h2><p className="mt-1 break-all text-sm text-sky-700">{submission.url}</p></div><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pending</Badge></div><p className="mt-4 text-sm leading-6 text-slate-600">{submission.description || "No description provided."}</p><div className="mt-4 flex flex-wrap gap-2"><Badge variant="outline" className="capitalize">{submission.pricing.replace("_", " ")}</Badge>{submission.license && <Badge variant="outline">{submission.license}</Badge>}<Badge variant="outline">Submitted {new Date(submission.createdAt).toLocaleDateString()}</Badge></div></div><div className="flex flex-col gap-2"><Button onClick={() => approveSubmission.mutate({ submissionId: submission.id })} disabled={approveSubmission.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button><Button onClick={() => rejectSubmission.mutate({ submissionId: submission.id })} disabled={rejectSubmission.isPending} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"><XCircle className="mr-2 h-4 w-4" /> Reject</Button></div></div></Card>)}</div> : <QueueEmpty label="submissions" />}</TabsContent><TabsContent value="relationships" className="mt-5">{relationshipsLoading ? <LoadingState /> : relationships && relationships.length > 0 ? <div className="grid gap-4">{relationships.map((relationship: any) => <Card key={relationship.id} className="border-l-4 border-l-violet-500 bg-white p-6 shadow-sm"><div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]"><div><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">{relationshipLabels[relationship.type] ?? relationship.type}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">Resource #{relationship.sourceId} <span className="text-slate-400">→</span> Resource #{relationship.targetId}</h2></div><Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100">Pending graph edge</Badge></div><p className="mt-4 text-sm leading-6 text-slate-600">Suggested by user #{relationship.createdBy}. Strength {Math.round(Number(relationship.strength) * 100)}%. Verify that this connection is meaningful, non-redundant, and defensible before publishing it.</p><p className="mt-3 text-xs text-slate-500">Created {new Date(relationship.createdAt).toLocaleDateString()}</p></div><div className="flex flex-col gap-2"><Button onClick={() => approveRelationship.mutate({ id: relationship.id })} disabled={approveRelationship.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button><Button onClick={() => rejectRelationship.mutate({ relationshipId: relationship.id })} disabled={rejectRelationship.isPending} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"><XCircle className="mr-2 h-4 w-4" /> Reject</Button></div></div></Card>)}</div> : <QueueEmpty label="relationship suggestions" />}</TabsContent></Tabs></div></div>;
}

function LoadingState() { return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-sky-600" /></div>; }
function QueueEmpty({ label }: { label: string }) { return <Card className="p-10 text-center shadow-sm"><CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" /><h2 className="font-semibold text-slate-950">Queue clear</h2><p className="mt-2 text-sm text-slate-600">No pending {label} to review.</p></Card>; }
