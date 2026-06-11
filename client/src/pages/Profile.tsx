import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Heart, Bookmark, FolderOpen, Loader2, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: contributions, isLoading: contributionsLoading } = trpc.resources.list.useQuery(
    { limit: 50 },
    { enabled: !!user?.id }
  );

  const { data: collections, isLoading: collectionsLoading } = trpc.collections.list.useQuery(
    { limit: 50 },
    { enabled: !!user?.id }
  );

  const { data: bookmarks, isLoading: bookmarksLoading } = trpc.bookmarks.list.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be signed in to view your profile.
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
      <div className="container max-w-4xl">
        <div className="mb-8">
          <Card className="p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{user?.name || 'User'}</h1>
                  <p className="text-gray-600">{user?.email}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge className="bg-blue-100 text-blue-800">Member</Badge>
                    {user?.role === 'admin' && <Badge className="bg-red-100 text-red-800">Admin</Badge>}
                  </div>
                </div>
              </div>
              <Button variant="outline">Edit Profile</Button>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="contributions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="contributions" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Contributions
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Bookmarks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contributions">
            {contributionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : contributions && contributions.length > 0 ? (
              <div className="grid gap-4">
                {contributions?.map((resource: any) => (
                  <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{resource.pricing}</Badge>
                          {resource.status === 'pending' && (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                          )}
                          {resource.status === 'approved' && (
                            <Badge className="bg-green-100 text-green-800">Approved</Badge>
                          )}
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => setLocation(`/resource/${resource.slug}`)}
                        >View →</Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">You haven't contributed any resources yet.</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setLocation('/submit')}>
                  Submit Your First Resource
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collections">
            {collectionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : collections && collections.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {collections?.map((collection: any) => (
                  <Card key={collection.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3 mb-3">
                      <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{collection.name}</h3>
                        <p className="text-sm text-gray-600">{collection.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-gray-600">{collection.resourceCount || 0} resources</span>
                      <Button variant="ghost" size="sm" onClick={() => setLocation(`/collection/${collection.id}`)}
                        >View →</Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">You haven't created any collections yet.</p>
                <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                  Create Your First Collection
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bookmarks">
            {bookmarksLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : bookmarks && bookmarks.length > 0 ? (
              <Card className="p-8 text-center">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">{bookmarks.length} bookmarked resources</p>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">You haven't bookmarked any resources yet.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
