import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, MessageCircle, Save, X, BarChart3, 
  Users, FileText, Calendar, TrendingUp, Eye, Clock,
  Shield, Settings, Activity, Upload, Image as ImageIcon,
  BookOpen, Globe, Tag, Link
} from 'lucide-react';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../hooks/useAuth';
import { Post, Comment, Admin, Image, Publication, Category } from '../lib/supabase';
import { PostService } from '../services/postService';
import { CommentService } from '../services/commentService';
import { AdminService } from '../services/adminService';
import { ImageService } from '../services/imageService';
import { PublicationService } from '../services/publicationService';
import { CategoryService } from '../services/categoryService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function AdminDashboard() {
  const { user, admin, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Publication[]>([]);  // Now using publications instead of posts
  const [comments, setComments] = useState<(Comment & { post_title: string })[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments' | 'publications' | 'admins'>('overview');
  
  // Post editing state
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Publications management state
  const [publications, setPublications] = useState<any[]>([]);
  const [showNewPublicationForm, setShowNewPublicationForm] = useState(false);
  const [publicationFormData, setPublicationFormData] = useState({
    title: '',
    content: '',
    category: 'articles',
    is_featured: false,
    is_published_on_main: true
  });
  const [editingPublication, setEditingPublication] = useState<string | null>(null);
  
  // Filter states
  const [publicationFilter, setPublicationFilter] = useState<'all' | 'old' | 'new'>('all');
  const [postsFilter, setPostsFilter] = useState<'all' | 'old' | 'new'>('all');
  
  // Publication images state
  const [publicationMainImage, setPublicationMainImage] = useState<File | null>(null);
  const [publicationAdditionalImages, setPublicationAdditionalImages] = useState<File[]>([]);
  const [publicationMainImagePreview, setPublicationMainImagePreview] = useState<string | null>(null);

  // إعادة توجيه للمستخدمين غير المسجلين أو غير المدراء
  if (!authLoading && (!user || !admin)) {
    return <Navigate to="/admin/login" replace />;
  }

  useEffect(() => {
    if (user && admin && !authLoading && !isLoadingData) {
      loadData();
    }
  }, [user, admin, authLoading]); // Add proper dependencies with auth loading check

  const loadData = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingData) {
      console.log('loadData already in progress, skipping');
      return;
    }

    const timeoutId = setTimeout(() => {
      console.warn('AdminDashboard loadData timeout - forcing loading to false');
      setLoading(false);
      setIsLoadingData(false);
      setError('انتهت مهلة تحميل البيانات');
    }, 8000);

    try {
      setLoading(true);
      setIsLoadingData(true);
      setError(null);
      
      console.log('Loading admin dashboard data...');
      
      // Load data with individual error handling
      const results = await Promise.allSettled([
        PublicationService.getAllPublications(), // Load publications for posts tab
        CommentService.getAllCommentsForAdmin(),
        // Skip admin service due to policy issue
        Promise.resolve([]),
        // Load publications from the database (for publications tab)
        PublicationService.getAllPublications(),
        // Load categories
        CategoryService.getAllCategories()
      ]);

      clearTimeout(timeoutId);

      // Handle results
      const postsData = results[0].status === 'fulfilled' ? results[0].value : []; // Now using publications
      const commentsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const adminsData: Admin[] = []; // Empty array until admin policy is fixed
      const publicationsData = results[3].status === 'fulfilled' ? results[3].value : [];
      const categoriesData = results[4].status === 'fulfilled' ? results[4].value : [];

      setPosts(postsData);  // Now contains publications
      setComments(commentsData);
      setAdmins(adminsData);
      setPublications(publicationsData);
      setCategories(categoriesData);
      
      console.log('Admin dashboard data loaded successfully');
      
      // Log any rejected promises
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Service ${index} failed:`, result.reason);
        }
      });
      
    } catch (err) {
      console.error('Error in loadData:', err);
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      // Set empty arrays to prevent undefined errors
      setPosts([]);
      setComments([]);
      setAdmins([]);
      setPublications([]);
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Validate images
    const validation = ImageService.validateImages(files);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setSelectedImages(files);
    setError(null);
  };

  // Remove selected image
  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };


  // Delete image from post
  const handleDeleteImage = async (imageId: string, postId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      return;
    }

    try {
      await ImageService.deleteImage(imageId);
      
      // Update posts state
      setPosts(prev => prev.map(post => {
        if (post.id === postId && post.images) {
          return {
            ...post,
            images: post.images.filter(img => img.id !== imageId)
          };
        }
        return post;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف الصورة');
    }
  };

  const handleUpdatePost = async (id: string, data: { title: string; description: string }) => {
    try {
      const updatedPost = await PostService.updatePost(id, data);
      setPosts(prev => prev.map(post => post.id === id ? updatedPost : post));
      setEditingPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث المنشور');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      return;
    }

    try {
      await PostService.deletePost(id);
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف المنشور');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
      return;
    }

    try {
      await CommentService.deleteComment(id);
      setComments(prev => prev.filter(comment => comment.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف التعليق');
    }
  };

  // Handle publication main image selection
  const handlePublicationMainImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate image
    const validation = ImageService.validateImages([file]);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setPublicationMainImage(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPublicationMainImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle publication additional images selection
  const handlePublicationAdditionalImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Additional images selection triggered');
    const files = Array.from(e.target.files || []);
    console.log('Selected files:', files.length, files.map(f => f.name));
    
    if (files.length === 0) {
      console.log('No files selected');
      return;
    }
    
    // Validate images
    const validation = ImageService.validateImages(files);
    console.log('Validation result:', validation);
    
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }
    
    setPublicationAdditionalImages(prev => {
      const newImages = [...prev, ...files];
      console.log('Updated additional images:', newImages.length);
      return newImages;
    });
    setError(null);
  };

  // Remove publication additional image
  const removePublicationAdditionalImage = (index: number) => {
    setPublicationAdditionalImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle publication form submission
  const handleCreatePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicationFormData.title.trim() || !publicationFormData.content.trim()) {
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      console.log('Creating publication with images:', {
        formData: publicationFormData,
        mainImage: publicationMainImage?.name,
        additionalImages: publicationAdditionalImages.length
      });
      
      // Create publication with images using the new service method
      const newPublication = await PublicationService.createPublicationWithImages(
        {
          title: publicationFormData.title.trim(),
          content: publicationFormData.content.trim(),
          category: publicationFormData.category,
          is_featured: publicationFormData.is_featured,
          is_published_on_main: publicationFormData.is_published_on_main
        },
        publicationMainImage || undefined,
        publicationAdditionalImages.length > 0 ? publicationAdditionalImages : undefined
      );
      
      // Update publications list
      setPublications(prev => [newPublication, ...prev]);
      
      // Reset form
      setPublicationFormData({
        title: '',
        content: '',
        category: 'articles',
        is_featured: false,
        is_published_on_main: true,
        additional_pages: []
      });
      setPublicationMainImage(null);
      setPublicationAdditionalImages([]);
      setPublicationMainImagePreview(null);
      setShowNewPublicationForm(false);
      
      console.log('Publication created successfully with images:', newPublication);
    } catch (err) {
      console.error('Error creating publication:', err);
      setError(err instanceof Error ? err.message : 'فشل في إنشاء المنشور');
    } finally {
      setUploading(false);
    }
  };

  // Handle publication deletion
  const handleDeletePublication = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟')) {
      return;
    }

    try {
      await PublicationService.deletePublication(id);
      setPublications(prev => prev.filter(publication => publication.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف المنشور');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Helper function to determine if a publication is from the old system
  const isOldPublication = (publication: any) => {
    // Publications with IDs starting with 'pub-' are from the old system
    // New publications created through the admin panel will have UUID format
    return publication.id && publication.id.startsWith('pub-');
  };

  // Filter functions
  const [postsOrder, setPostsOrder] = useState<'newest' | 'oldest'>('newest');
  const [publicationOrder, setPublicationOrder] = useState<'newest' | 'oldest'>('newest');

  const sortDataByDate = (data, order) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const getSortedPosts = () => {
    return sortDataByDate(posts, postsOrder);
  };

  const getSortedPublications = () => {
    return sortDataByDate(publications, publicationOrder);
  };

  // Filter functions for posts and publications
  const getFilteredPosts = () => {
    let filteredData = posts;
    
    if (postsFilter === 'old') {
      filteredData = posts.filter(post => isOldPublication(post));
    } else if (postsFilter === 'new') {
      filteredData = posts.filter(post => !isOldPublication(post));
    }
    
    return sortDataByDate(filteredData, postsOrder);
  };

  const getFilteredPublications = () => {
    let filteredData = publications;
    
    if (publicationFilter === 'old') {
      filteredData = publications.filter(publication => isOldPublication(publication));
    } else if (publicationFilter === 'new') {
      filteredData = publications.filter(publication => !isOldPublication(publication));
    }
    
    return sortDataByDate(filteredData, publicationOrder);
  };

  const getRecentActivity = () => {
    const recentPosts = posts.slice(0, 3);
    const recentComments = comments.slice(0, 5);
    
    return {
      recentPosts,
      recentComments,
      totalPosts: posts.length,
      totalComments: comments.length,
      totalAdmins: admins.length
    };
  };

  if (authLoading || loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-600 mt-4">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  const activity = getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">مرحباً، {admin?.name}</h1>
            <p className="text-primary-100">لوحة التحكم الرئيسية</p>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-center">
              <div className="text-2xl font-bold">{activity.totalPosts}</div>
              <div className="text-sm text-primary-100">منشور</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activity.totalComments}</div>
              <div className="text-sm text-primary-100">تعليق</div>
            </div>
            {admin?.role === 'super_admin' && (
              <div className="text-center">
                <div className="text-2xl font-bold">{activity.totalAdmins}</div>
                <div className="text-sm text-primary-100">مدير</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <nav className="flex space-x-8 space-x-reverse px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="h-4 w-4" />
              <span>نظرة عامة</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'posts'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-4 w-4" />
              <span>المنشورات ({posts.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'comments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <MessageCircle className="h-4 w-4" />
              <span>التعليقات ({comments.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('publications')}
            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'publications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <FileText className="h-4 w-4" />
              <span>إدارة المنشورات</span>
            </div>
          </button>
          {admin?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'admins'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <Shield className="h-4 w-4" />
                <span>المدراء ({admins.length})</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي المنشورات</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.totalPosts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-secondary-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-secondary-600" />
                </div>
                <div className="mr-4">
                  <p className="text-sm font-medium text-gray-600">إجمالي التعليقات</p>
                  <p className="text-2xl font-bold text-gray-900">{activity.totalComments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 ml-2" />
                النشاط الأخير
              </h3>
            </div>
            <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
              {activity.recentComments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className="p-1 bg-blue-100 rounded-full">
                    <MessageCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{comment.name}</span> علق على{' '}
                      <span className="font-medium">{comment.post_title}</span>
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
              ))}
              
              {activity.recentPosts.map((post) => (
                <div key={post.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className="p-1 bg-green-100 rounded-full">
                    <FileText className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      تم نشر منشور جديد: <span className="font-medium">{post.title}</span>
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <FileText className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">عرض المنشورات</h3>
                  <p className="text-sm text-gray-500">عرض جميع المنشورات المنشورة في الموقع</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('publications')}
                className="btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 ml-2" />
                إدارة المنشورات
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Filter for Posts Tab */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">تصفية حسب المصدر:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPostsFilter('all')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      postsFilter === 'all'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    جميع المنشورات
                  </button>
                  <button
                    onClick={() => setPostsFilter('old')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      postsFilter === 'old'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    المنشورات القديمة
                  </button>
                  <button
                    onClick={() => setPostsFilter('new')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      postsFilter === 'new'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    المنشورات الجديدة
                  </button>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {getFilteredPosts().length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {postsFilter === 'all' ? 'لا توجد منشورات' :
                     postsFilter === 'old' ? 'لا توجد منشورات قديمة' : 'لا توجد منشورات جديدة'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {postsFilter === 'all' ? 'لا توجد منشورات منشورة حالياً' :
                     postsFilter === 'old' ? 'لا توجد منشورات من النظام القديم' : 'لا توجد منشورات من النظام الجديد'}
                  </p>
                  <button
                    onClick={() => setActiveTab('publications')}
                    className="btn-secondary flex items-center mx-auto"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    انتقل لإدارة المنشورات
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {getFilteredPosts().map((publication) => (
                    <PublicationViewItemCompact
                      key={publication.id}
                      publication={publication}
                      formatDate={formatDate}
                      isOldPublication={isOldPublication}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">إدارة التعليقات</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <h4 className="font-medium text-gray-900">{comment.name}</h4>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{comment.post_title}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.comment}</p>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 ml-1" />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف التعليق"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد تعليقات</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Publications Tab */}
      {activeTab === 'publications' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 space-x-reverse">
                <BookOpen className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">إدارة منشورات الموقع</h3>
                  <p className="text-sm text-gray-500">إضافة وتحرير المنشورات التي تظهر في الصفحة الرئيسية وصفحات أخرى</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPublicationForm(true)}
                className="btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 ml-2" />
                منشور موقع جديد
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Filter for Publications Tab */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">تصفية حسب المصدر:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPublicationFilter('all')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      publicationFilter === 'all'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    جميع المنشورات
                  </button>
                  <button
                    onClick={() => setPublicationFilter('old')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      publicationFilter === 'old'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    المنشورات القديمة
                  </button>
                  <button
                    onClick={() => setPublicationFilter('new')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      publicationFilter === 'new'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    المنشورات الجديدة
                  </button>
                </div>
              </div>
            </div>
            
            {/* New Publication Form */}
            {showNewPublicationForm && (
              <form onSubmit={handleCreatePublication} className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Globe className="h-5 w-5 ml-2 text-blue-600" />
                    إنشاء منشور جديد للموقع
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPublicationForm(false);
                      setPublicationFormData({
                        title: '',
                        content: '',
                        category: 'articles',
                        is_featured: false,
                        is_published_on_main: true,
                        additional_pages: []
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText className="h-4 w-4 inline ml-1" />
                        عنوان المنشور
                      </label>
                      <input
                        type="text"
                        value={publicationFormData.title}
                        onChange={(e) => setPublicationFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="input-field"
                        placeholder="أدخل عنوان المنشور"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Tag className="h-4 w-4 inline ml-1" />
                        نوع المنشور
                      </label>
                      <select
                        value={publicationFormData.category}
                        onChange={(e) => setPublicationFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="input-field"
                      >
                        {categories.length > 0 ? (
                          categories.map(category => (
                            <option key={category.id} value={category.slug}>
                              {category.name_ar}
                            </option>
                          ))
                        ) : (
                          // Fallback options if categories aren't loaded
                          <>
                            <option value="articles">مقالات</option>
                            <option value="reports">تقارير</option>
                            <option value="research">أبحاث</option>
                            <option value="news">أخبار</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Publication Settings */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">إعدادات النشر</h5>
                      
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={publicationFormData.is_featured}
                            onChange={(e) => setPublicationFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="mr-2 text-sm text-gray-700">منشور مميز</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={publicationFormData.is_published_on_main}
                            onChange={(e) => setPublicationFormData(prev => ({ ...prev, is_published_on_main: e.target.checked }))}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="mr-2 text-sm text-gray-700">نشر في الصفحة الرئيسية</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Content */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المحتوى الكامل
                      </label>
                      <textarea
                        value={publicationFormData.content}
                        onChange={(e) => setPublicationFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={6}
                        className="input-field resize-none"
                        placeholder="أدخل المحتوى الكامل للمنشور"
                        required
                      />
                    </div>

                    {/* Main Cover Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <ImageIcon className="h-4 w-4 inline ml-1" />
                        صورة الغلاف الرئيسية
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                        <input
                          type="file"
                          id="publicationMainImage"
                          accept="image/*"
                          onChange={handlePublicationMainImageSelect}
                          className="hidden"
                        />
                        <label htmlFor="publicationMainImage" className="cursor-pointer">
                          {publicationMainImagePreview ? (
                            <div className="relative">
                              <img
                                src={publicationMainImagePreview}
                                alt="Preview"
                                className="w-full h-32 object-cover rounded-lg mb-2"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPublicationMainImage(null);
                                  setPublicationMainImagePreview(null);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-75 hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                اضغط لاختيار صورة الغلاف
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Additional Images Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <ImageIcon className="h-4 w-4 inline ml-1" />
                        صور إضافية (اختياري)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                        <input
                          type="file"
                          id="publicationAdditionalImages"
                          multiple
                          accept="image/*"
                          onChange={handlePublicationAdditionalImagesSelect}
                          className="hidden"
                        />
                        <label htmlFor="publicationAdditionalImages" className="cursor-pointer block">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">
                            اضغط لاختيار صور إضافية
                          </p>
                          <p className="text-xs text-gray-500">
                            يمكنك رفع عدة صور (JPG, PNG, WebP) - حد أقصى 5 ميجابايت لكل صورة
                          </p>
                        </label>
                      </div>
                      
                      {/* Additional Images Preview */}
                      {publicationAdditionalImages.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            الصور الإضافية ({publicationAdditionalImages.length}):
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            {publicationAdditionalImages.map((file, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Additional ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removePublicationAdditionalImage(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    سيتم نشر هذا المحتوى في صفحة المنشورات وأي صفحات إضافية محددة
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <button 
                      type="submit" 
                      disabled={uploading || !publicationFormData.title.trim() || !publicationFormData.content.trim()}
                      className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <>
                          <LoadingSpinner size="sm" className="ml-2" />
                          جاري النشر...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 ml-2" />
                          نشر المحتوى
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Publications List */}
            <div className="space-y-4">
              {getFilteredPublications().length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {publicationFilter === 'all' ? 'لا توجد منشورات للموقع' :
                     publicationFilter === 'old' ? 'لا توجد منشورات قديمة' : 'لا توجد منشورات جديدة'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {publicationFilter === 'all' ? 'ابدأ بإنشاء منشور جديد لعرضه في الموقع' :
                     publicationFilter === 'old' ? 'لا توجد منشورات من النظام القديم' : 'لا توجد منشورات من النظام الجديد'}
                  </p>
                  {publicationFilter !== 'old' && (
                    <button
                      onClick={() => setShowNewPublicationForm(true)}
                      className="btn-primary flex items-center mx-auto"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      إنشاء أول منشور
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredPublications().map((publication) => (
                    <div key={publication.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200 overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{publication.title}</h3>
                              {publication.is_featured && (
                                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex-shrink-0">
                                  مميز
                                </span>
                              )}
                              {/* Source indicator */}
                              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                isOldPublication(publication) 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {isOldPublication(publication) ? 'قديم' : 'جديد'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{publication.content.substring(0, 100)}...</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {publication.category === 'articles' ? 'مقالات' :
                                 publication.category === 'reports' ? 'تقارير' :
                                 publication.category === 'research' ? 'أبحاث' :
                                 publication.category === 'news' ? 'أخبار' : publication.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span className="truncate">{formatDate(publication.created_at)}</span>
                              </span>
                              {publication.is_published_on_main && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                                  <Globe className="h-2.5 w-2.5" />
                                  <span className="text-xs">الرئيسية</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                            <button
                              onClick={() => setEditingPublication(publication.id)}
                              className="p-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                              title="تعديل المنشور"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePublication(publication.id)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="حذف المنشور"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Help Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-4 space-x-reverse">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">كيفية استخدام إدارة المنشورات</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• استخدم هذا القسم لإضافة منشورات تظهر في صفحة المنشورات الخاصة بالموقع</li>
                    <li>• يمكنك تحديد نوع المنشور (مقال، تقرير، بحث، خبر) لتصنيفه بشكل صحيح</li>
                    <li>• اختر "منشور مميز" لإبرازه في القسم المميز بالموقع</li>
                    <li>• حدد الصفحات الإضافية التي تريد نشر المحتوى فيها</li>
                    <li>• سيظهر المحتوى تلقائياً في صفحة المنشورات بالتصميم المطلوب</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admins Tab (Super Admin Only) */}
      {activeTab === 'admins' && admin?.role === 'super_admin' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">إدارة المدراء</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {admins.map((adminUser) => (
                <div key={adminUser.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="p-2 bg-primary-100 rounded-full">
                        <Shield className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{adminUser.name}</h4>
                        <p className="text-sm text-gray-500">{adminUser.email}</p>
                        <div className="flex items-center space-x-2 space-x-reverse mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            adminUser.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {adminUser.role === 'super_admin' ? 'مدير عام' : 'مدير'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            adminUser.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {adminUser.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {adminUser.last_login ? (
                        <span>آخر دخول: {formatDate(adminUser.last_login)}</span>
                      ) : (
                        <span>لم يسجل دخول بعد</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {admins.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد بيانات مدراء</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Post Item Component
interface PostItemProps {
  post: Post;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, data: { title: string; description: string }) => void;
  onDelete: (id: string) => void;
  onDeleteImage?: (imageId: string, postId: string) => void;
  formatDate: (date: string) => string;
}

function PostItem({ post, isEditing, onEdit, onCancelEdit, onUpdate, onDelete, onDeleteImage, formatDate }: PostItemProps) {
  const [editData, setEditData] = useState({
    title: post.title,
    description: post.description
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(post.id, editData);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Validate images
    const validation = ImageService.validateImages(files);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }
    
    setSelectedImages(files);
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit className="h-5 w-5 ml-2 text-blue-600" />
            تحرير المنشور
          </h4>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline ml-1" />
                عنوان المنشور
              </label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="أدخل عنوان المنشور"
                required
              />
            </div>
            
            {/* Post Images Management */}
            {post.images && post.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="h-4 w-4 inline ml-1" />
                  الصور الحالية ({post.images.length})
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {post.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.alt_text || 'صورة المنشور'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {onDeleteImage && (
                        <button
                          type="button"
                          onClick={() => onDeleteImage(image.id, post.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="حذف الصورة"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add New Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="h-4 w-4 inline ml-1" />
                إضافة صور جديدة
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  id={`postImages-${post.id}`}
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label htmlFor={`postImages-${post.id}`} className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    اضغط لاختيار صور جديدة
                  </p>
                  <p className="text-xs text-gray-500">
                    يمكنك رفع عدة صور (JPG, PNG, WebP) - حد أقصى 5 ميجابايت لكل صورة
                  </p>
                </label>
              </div>
              
              {/* New Images Preview */}
              {selectedImages.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    الصور الجديدة ({selectedImages.length}):
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                محتوى المنشور
              </label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                rows={8}
                className="input-field resize-none"
                placeholder="أدخل محتوى المنشور"
                required
              />
            </div>
            
            {/* Post Info */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-3">معلومات المنشور</h5>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>تاريخ الإنشاء:</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
                {post.updated_at && (
                  <div className="flex items-center justify-between">
                    <span>آخر تحديث:</span>
                    <span>{formatDate(post.updated_at)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>عدد الصور:</span>
                  <span>{post.images?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            سيتم حفظ التغييرات على المنشور مباشرة
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button 
              type="submit" 
              disabled={uploading || !editData.title.trim() || !editData.description.trim()}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <LoadingSpinner size="sm" className="ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
              {post.images && post.images.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                  <ImageIcon className="h-3 w-3" />
                  <span>{post.images.length}</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 text-sm font-medium"
              title="تعديل المنشور"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
              title="حذف المنشور"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">حذف</span>
            </button>
          </div>
        </div>
        
        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ImageIcon className="h-4 w-4 ml-1" />
              الصور المرفقة ({post.images.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {post.images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                    <img
                      src={image.url}
                      alt={image.alt_text || `صورة من المنشور`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  {onDeleteImage && (
                    <button
                      onClick={() => onDeleteImage(image.id, post.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600 shadow-lg hover:shadow-xl transform hover:scale-110"
                      title="حذف الصورة"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {image.caption && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="truncate" title={image.caption}>
                        {image.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Publication View Item Component for read-only display in Posts Tab (compact version)
interface PublicationViewItemCompactProps {
  publication: Publication;
  formatDate: (date: string) => string;
  isOldPublication: (publication: any) => boolean;
}

function PublicationViewItemCompact({ publication, formatDate, isOldPublication }: PublicationViewItemCompactProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">{publication.title}</h3>
              {publication.is_featured && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full flex-shrink-0">
                  مميز
                </span>
              )}
              {/* Source indicator */}
              <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                isOldPublication(publication) 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isOldPublication(publication) ? 'قديم' : 'جديد'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{publication.content.substring(0, 100)}...</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                {publication.category === 'articles' ? 'مقالات' :
                 publication.category === 'reports' ? 'تقارير' :
                 publication.category === 'research' ? 'أبحاث' :
                 publication.category === 'news' ? 'أخبار' : publication.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span className="truncate">{formatDate(publication.created_at)}</span>
              </span>
              {publication.is_published_on_main && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full">
                  <Globe className="h-2.5 w-2.5" />
                  <span className="text-xs">الرئيسية</span>
                </span>
              )}
            </div>
          </div>
          
          {/* Read-only indicator */}
          <div className="flex items-center ml-3 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs">
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">عرض</span>
            </div>
          </div>
        </div>
        
        {/* Small image preview if exists */}
        {publication.main_image_url && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img
                  src={publication.main_image_url}
                  alt={publication.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-xs text-gray-500">يحتوي على صورة</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Publication Item Component for Posts Tab
interface PublicationItemProps {
  publication: Publication;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (id: string, data: { title: string; content: string }) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string) => string;
}

function PublicationItem({ publication, isEditing, onEdit, onCancelEdit, onUpdate, onDelete, formatDate }: PublicationItemProps) {
  const [editData, setEditData] = useState({
    title: publication.title,
    content: publication.content
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(publication.id, editData);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit className="h-5 w-5 ml-2 text-blue-600" />
            تحرير المنشور
          </h4>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline ml-1" />
              عنوان المنشور
            </label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="input-field"
              placeholder="أدخل عنوان المنشور"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              محتوى المنشور
            </label>
            <textarea
              value={editData.content}
              onChange={(e) => setEditData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              className="input-field resize-none"
              placeholder="أدخل محتوى المنشور"
              required
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            سيتم حفظ التغييرات على المنشور مباشرة
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button 
              type="submit" 
              disabled={!editData.title.trim() || !editData.content.trim()}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{publication.title}</h3>
              {publication.is_featured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  مميز
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-3 line-clamp-3">{publication.content.substring(0, 150)}...</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {publication.category === 'articles' ? 'مقالات' :
                 publication.category === 'reports' ? 'تقارير' :
                 publication.category === 'research' ? 'أبحاث' :
                 publication.category === 'news' ? 'أخبار' : publication.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(publication.created_at)}
              </span>
            </div>
            
            {/* Publishing Status */}
            <div className="flex flex-wrap gap-2">
              {publication.is_published_on_main && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  <Globe className="h-3 w-3" />
                  الصفحة الرئيسية
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 px-3 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all duration-200 text-sm font-medium"
              title="تعديل المنشور"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">تعديل</span>
            </button>
            <button
              onClick={() => onDelete(publication.id)}
              className="flex items-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
              title="حذف المنشور"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">حذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
