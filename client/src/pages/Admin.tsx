import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('submissions');

  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = trpc.moderation.getPendingSubmissions.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && user?.role === 'admin' }
  );



  const approveSubmission = trpc.moderation.approveSubmission.useMutation({
    onSuccess: () => refetchSubmissions(),
  });

  const rejectSubmission = trpc.moderation.rejectSubmission.useMutation({
    onSuccess: () => refetchSubmissions(),
  });

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You need admin privileges to access the moderation dashboard.
            </p>
            <Button onClick={() => setLocation('/')} className="bg-blue-600 hover:bg-blue-700">
              Go to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="container max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Moderation Dashboard</h1>
          <p className="text-gray-600">
            Review and approve pending resource submissions and relationships.
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-8">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Submissions ({submissions?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            {submissionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : submissions && submissions.length > 0 ? (
              <div className="grid gap-4">
                {submissions.map((submission: any) => (
                  <Card key={submission.id} className="p-6 border-l-4 border-l-yellow-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold mb-1">{submission.title}</h3>
                            <p className="text-sm text-gray-600">{submission.url}</p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{submission.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{submission.pricing}</Badge>
                          {submission.license && <Badge variant="outline">{submission.license}</Badge>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => approveSubmission.mutate({ submissionId: submission.id })}
                          disabled={approveSubmission.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {approveSubmission.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => rejectSubmission.mutate({ submissionId: submission.id })}
                          disabled={rejectSubmission.isPending}
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          {rejectSubmission.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No pending submissions to review.</p>
              </Card>
            )}
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
}
