import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface FormData {
  title: string;
  description: string;
  url: string;
  categoryId: string;
  subcategoryId: string;
  pricing: string;
  license: string;
  tags: string;
}

export default function Submit() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    url: '',
    categoryId: '',
    subcategoryId: '',
    pricing: 'free',
    license: '',
    tags: '',
  });

  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: subcategories } = trpc.categories.getSubcategories.useQuery(
    { categoryId: parseInt(formData.categoryId) },
    { enabled: !!formData.categoryId }
  );

  const checkDuplicates = useCallback(async (title: string, url: string) => {
    if (!title.trim() && !url.trim()) {
      setDuplicates([]);
      return;
    }

    setIsCheckingDuplicates(true);
    try {
      const results = await Promise.all([
        url.trim() ? trpc.resources.checkDuplicateByUrl.useQuery({ url: url.trim() }) : Promise.resolve({ data: null }),
      ]);

      const combined = results
        .filter(r => r.data)
        .map(r => r.data)
        .filter((item, index, self) => index === self.findIndex(t => t?.id === item?.id));

      setDuplicates(combined as any);
    } catch (error) {
      console.error('Duplicate check failed:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, []);

  useMemo(() => {
    const timer = setTimeout(() => {
      checkDuplicates(formData.title, formData.url);
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.title, formData.url, checkDuplicates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setLocation('/');
      return;
    }

    if (!formData.title.trim() || !formData.url.trim() || !formData.categoryId) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    if (duplicates.length > 0) {
      setSubmitError('Please review the duplicate resources below before submitting');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await trpc.resources.submitResource.useMutation().mutateAsync({
        title: formData.title,
        description: formData.description,
        url: formData.url,
        categoryId: parseInt(formData.categoryId),
        subcategoryId: formData.subcategoryId ? parseInt(formData.subcategoryId) : undefined,
        pricing: formData.pricing as any,
        license: formData.license,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      setSubmitSuccess(true);
      setFormData({
        title: '',
        description: '',
        url: '',
        categoryId: '',
        subcategoryId: '',
        pricing: 'free',
        license: '',
        tags: '',
      });

      setTimeout(() => {
        setLocation(`/resource/${result.slug}`);
      }, 2000);
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to submit resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="container max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be signed in to submit a resource.
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
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Submit a Resource</h1>
          <p className="text-gray-600">
            Help the community discover valuable tools and resources. Fill out the form below to submit a new resource.
          </p>
        </div>

        {submitSuccess && (
          <Card className="mb-8 p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Resource submitted successfully!</p>
                <p className="text-sm text-green-700">Redirecting to resource page...</p>
              </div>
            </div>
          </Card>
        )}

        {submitError && (
          <Card className="mb-8 p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-900">{submitError}</p>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Title *
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Figma, GitHub, Slack"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource URL *
                </label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    required
                    className="flex-1"
                  />
                  {isCheckingDuplicates && <Loader2 className="w-5 h-5 animate-spin text-blue-500 my-auto" />}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this resource does and why it's valuable..."
                  rows={4}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {duplicates.length > 0 && (
            <Card className="p-6 border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900">Possible Duplicates Found</h3>
                  <p className="text-sm text-amber-700">
                    We found {duplicates.length} similar resource{duplicates.length !== 1 ? 's' : ''}. 
                    Please review before submitting.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {duplicates.map(resource => (
                  <div key={resource.id} className="p-3 bg-white rounded border border-amber-200">
                    <p className="font-medium text-gray-900">{resource.title}</p>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                    <a href={`/resource/${resource.slug}`} className="text-sm text-blue-600 hover:underline">
                      View Resource →
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Categorization</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcategories && subcategories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <Select value={formData.subcategoryId} onValueChange={(value) => handleSelectChange('subcategoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(subcat => (
                        <SelectItem key={subcat.id} value={subcat.id.toString()}>
                          {subcat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pricing Model
                </label>
                <Select value={formData.pricing} onValueChange={(value) => handleSelectChange('pricing', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="open_source">Open Source</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License
                </label>
                <Input
                  type="text"
                  name="license"
                  value={formData.license}
                  onChange={handleInputChange}
                  placeholder="e.g., MIT, Apache 2.0, Commercial"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <Input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., design, collaboration, remote"
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || duplicates.length > 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Resource'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/')}
            >
              Cancel
            </Button>
          </div>
        </form>

        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Tips for a Great Submission</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Use a clear, descriptive title</li>
            <li>✓ Provide a detailed description of what the resource does</li>
            <li>✓ Select the most relevant category</li>
            <li>✓ Add relevant tags to improve discoverability</li>
            <li>✓ Ensure the URL is correct and accessible</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
