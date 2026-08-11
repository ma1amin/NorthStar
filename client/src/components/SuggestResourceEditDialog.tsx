import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { FilePenLine, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type EditableResource = { id: number; title: string; description?: string | null; url: string; builtBy?: string | null; builtByUrl?: string | null };

export function SuggestResourceEditDialog({ resource, isAuthenticated }: { resource: EditableResource; isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description ?? "");
  const [url, setUrl] = useState(resource.url);
  const [builtBy, setBuiltBy] = useState(resource.builtBy ?? "");
  const [note, setNote] = useState("");
  const suggest = trpc.resources.suggestEdit.useMutation({
    onSuccess: () => { toast.success("Edit suggestion sent for human review"); setOpen(false); setNote(""); },
    onError: (error) => toast.error(error.message || "Unable to send edit suggestion"),
  });

  const openDialog = () => {
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    setTitle(resource.title); setDescription(resource.description ?? ""); setUrl(resource.url); setBuiltBy(resource.builtBy ?? ""); setOpen(true);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const changes = {
      ...(title.trim() !== resource.title ? { title: title.trim() } : {}),
      ...(description.trim() !== (resource.description ?? "") ? { description: description.trim() } : {}),
      ...(url.trim() !== resource.url ? { url: url.trim() } : {}),
      ...(builtBy.trim() !== (resource.builtBy ?? "") ? { builtBy: builtBy.trim() } : {}),
    };
    if (!Object.keys(changes).length) { toast.info("Change at least one field before submitting"); return; }
    suggest.mutate({ resourceId: resource.id, changes, note: note.trim() || undefined });
  };

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" onClick={openDialog}><FilePenLine className="mr-2 h-4 w-4" /> Suggest edit</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Suggest a resource correction</DialogTitle><DialogDescription>Your proposal is reviewed by a moderator before any public resource data changes.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">Title</span><Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} /></label><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">Description</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} /></label><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">Official URL</span><Input type="url" value={url} onChange={(event) => setUrl(event.target.value)} /></label><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">Built by</span><Input value={builtBy} onChange={(event) => setBuiltBy(event.target.value)} maxLength={255} /></label><label className="block space-y-1.5"><span className="text-sm font-medium text-slate-800">Why is this correction needed? <span className="font-normal text-slate-500">(optional)</span></span><Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} placeholder="Share a source or helpful context for the reviewer." /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={suggest.isPending} className="bg-sky-600 text-white hover:bg-sky-700">{suggest.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending</> : "Send suggestion"}</Button></DialogFooter></form></DialogContent></Dialog>;
}
