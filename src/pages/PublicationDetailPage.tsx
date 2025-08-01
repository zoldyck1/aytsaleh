import { CommentService } from '../services/commentService';
import { Comment, NewComment } from '../lib/supabase';
import { ImageModal } from '../components/ImageModal';

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Image as ImageIcon, Quote, Clock, Eye, Heart, Share2, Bookmark, ChevronLeft, ChevronRight, X, ZoomIn, User, Tag, MessageCircle, BookOpen, ChevronDown, Send, Plus } from 'lucide-react';
import { Post, Publication } from '../lib/supabase';
import { PostService } from '../services/postService';
import { PublicationService } from '../services/publicationService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useLanguage } from '../contexts/LanguageContext';

// Arabic date formatting function
const formatArabicDate = (dateString: string) => {
  const date = new Date(dateString);
  
  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  const day = date.getDate();
  const month = arabicMonths[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} ${year} - ${hours}:${minutes}`;
};

// Fallback function for legacy code
const formatDate = (dateString: string) => {
  return formatArabicDate(dateString);
};

const usePublication = (id: string | undefined) => {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      if (id.startsWith('pub-')) {
        const publicationId = id.replace('pub-', '');
        const publication = await PublicationService.getPublicationById(publicationId);
        
        if (!publication) {
          setError('المنشور غير موجود');
          return;
        }
        
        const postData: Post = {
          id: `pub-${publication.id}`,
          title: publication.title,
          description: publication.content,
          created_at: publication.created_at,
          author: 'إدارة المحتوى',
          images: [],
          category: {
            id: publication.category,
            name: publication.category,
            name_ar: publication.category === 'articles' ? 'مقالات' :
                     publication.category === 'reports' ? 'تقارير' :
                     publication.category === 'research' ? 'أبحاث' :
                     publication.category === 'news' ? 'أخبار' : publication.category,
            slug: publication.category,
            is_active: true,
            display_order: 0,
            created_at: publication.created_at
          }
        };
        
        if (publication.main_image_url) {
          postData.images!.push({
            id: `pub-img-main-${publication.id}`,
            url: publication.main_image_url,
            alt_text: publication.title,
            caption: null,
            display_order: 0,
            created_at: publication.created_at,
            post_id: postData.id,
            file_name: 'main-image'
          });
        }
        
        if (publication.additional_images && publication.additional_images.length > 0) {
          publication.additional_images.forEach((imageUrl, index) => {
            postData.images!.push({
              id: `pub-img-add-${publication.id}-${index}`,
              url: imageUrl,
              alt_text: `${publication.title} - Image ${index + 2}`,
              caption: null,
              display_order: index + 1,
              created_at: publication.created_at,
              post_id: postData.id,
              file_name: `additional-image-${index + 1}`
            });
          });
        }
        
        setPost(postData);
        loadComments(postData.id);
      } else {
        const postData = await PostService.getPostById(id);

        if (!postData) {
          setError('المنشور غير موجود');
          return;
        }

        setPost(postData);
        loadComments(postData.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      console.log(`Fetching comments for post ID: ${postId}`);
      const fetchedComments = await CommentService.getCommentsByPostId(postId);
      console.log('Fetched comments:', fetchedComments);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (comment: NewComment) => {
    try {
      console.log('Attempting to add comment:', comment);
      const newComment = await CommentService.createComment(comment);
      console.log('Comment added successfully:', newComment);
      setComments([newComment, ...comments]);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error; // Re-throw to let the UI component handle it
    }
  };

  return { post, loading, error, comments, handleAddComment };
};

const PostHeader = ({ post }: { post: Post }) => {
    const { isRTL } = useLanguage();
    const navigate = useNavigate();
    
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: post.title,
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href)
                .then(() => alert('تم نسخ الرابط!'))
                .catch(console.error);
        }
    };

  return (
    <div className="rtl:text-right ltr:text-left">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center space-x-1 space-x-reverse text-primary-600 hover:text-primary-700 mb-6 transition-colors duration-200 hover:bg-primary-50 px-3 py-2 rounded-lg"
      >
        <ArrowRight className="h-4 w-4" />
        <span>العودة</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2 space-x-reverse text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full shadow-sm">
          <User className="w-4 h-4" />
          <span className="font-medium">{post.author}</span>
          <span className="text-emerald-400">•</span>
          <Clock className="w-4 h-4" />
          <span>{formatArabicDate(post.created_at)}</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare} 
            className="flex items-center space-x-1 space-x-reverse px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">شارك</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const PostBody = ({ post, onImageClick }: { post: Post; onImageClick: (index: number) => void }) => (
  <article className="card mb-8">
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-relaxed font-arabic">
        {post.title}
      </h1>
      
      <div className="flex items-center space-x-2 space-x-reverse text-gray-500 mb-6">
        <Calendar className="h-5 w-5" />
        <span className="text-sm">{formatArabicDate(post.created_at)}</span>
      </div>
      
      <div className="prose prose-lg max-w-none rtl:text-right">
        <blockquote className="rtl:border-r-4 rtl:border-l-0 ltr:border-l-4 border-primary-600 rtl:pr-4 rtl:pl-0 ltr:pl-4 mb-6 text-gray-600 bg-gray-50 py-4 rounded-lg">
          <Quote className="inline rtl:ml-2 ltr:mr-2 text-primary-500" />
          <span className="text-lg leading-relaxed font-arabic">{post.description}</span>
        </blockquote>
      </div>
      
      {post.images && post.images.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-2 space-x-reverse mb-6">
            <ImageIcon className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              الصور المرفقة ({post.images.length})
            </h3>
          </div>
          
          {/* Modern Image Gallery with Enhanced UI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {post.images.map((image, index) => (
              <div 
                key={image.id} 
                className="group relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => onImageClick(index)}
              >
                {/* Image Container with Modern Effects */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt_text || `صورة ${index + 1} من المنشور`}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 filter group-hover:brightness-110"
                    loading="lazy"
                  />
                  
                  {/* Hover Overlay with Modern Glass Effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <ZoomIn className="w-4 h-4" />
                      <span className="text-sm font-medium">عرض بحجم كامل</span>
                    </div>
                  </div>
                  
                  {/* Image Number Badge */}
                  <div className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center text-sm font-semibold border border-white/20">
                    {index + 1}
                  </div>
                  
                  {/* Progress Bar for Multiple Images */}
                  {post.images.length > 1 && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="w-full bg-white/20 rounded-full h-1 backdrop-blur-sm">
                        <div 
                          className="bg-white h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${((index + 1) / post.images.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Caption with Modern Styling */}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                    <h4 className="text-white text-sm font-medium leading-relaxed drop-shadow-lg">
                      {image.caption}
                    </h4>
                  </div>
                )}
                
                {/* Subtle Decorative Border */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 group-hover:ring-primary-500/20 transition-all duration-300"></div>
              </div>
            ))}
          </div>
          
          {/* Gallery Info */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                انقر على أي صورة لعرضها بحجم كامل مع إمكانية التنقل والتكبير
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  </article>
);

const CommentSection = ({ postId, comments, onAddComment }: { postId: string, comments: Comment[], onAddComment: (comment: NewComment) => void }) => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            console.log('Submitting comment for post:', postId);
            console.log('Comment data:', { post_id: postId, name, comment: message });
            await onAddComment({ post_id: postId, name, comment: message });
            setName('');
            setMessage('');
            console.log('Comment submitted successfully');
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert(`خطأ في إرسال التعليق: ${error instanceof Error ? error.message : 'خطأ غير متوقع'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            {/* Comments Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
                    <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">التعليقات ({comments.length})</h3>
            </div>

            {/* Add Comment Form */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    أضف تعليقك
                </h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="comment-name" className="block text-sm font-medium text-gray-700 mb-2">
                            الاسم
                        </label>
                        <input
                            type="text"
                            id="comment-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="أدخل اسمك"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="comment-message" className="block text-sm font-medium text-gray-700 mb-2">
                            رسالتك
                        </label>
                        <textarea
                            id="comment-message"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                            placeholder="اكتب تعليقك هنا..."
                            required
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || !message.trim()}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال التعليق'}
                    </button>
                </form>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                    </div>
                ) : (
                    comments.map((comment, index) => (
                        <div key={comment.id} className="bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-full font-semibold text-sm">
                                    {comment.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-semibold text-gray-800">{comment.name}</h5>
                                        <span className="text-xs text-gray-400">#{index + 1}</span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed mb-2">{comment.comment}</p>
                                    <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        <span>{formatArabicDate(comment.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export function PublicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { post, loading, error, comments, handleAddComment } = usePublication(id);
  const [showComments, setShowComments] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const navigateImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-600 mt-4">جاري تحميل المنشور...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-8">
        <ErrorMessage message={error || 'المنشور غير موجود'} />
        <div className="text-center mt-4">
          <Link to="/" className="btn-primary">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto post-detail-page" data-page="post-detail">
      <PostHeader post={post} />
      <PostBody post={post} onImageClick={handleImageClick} />
      
      {/* Image Modal */}
      {post.images && post.images.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          images={post.images}
          currentIndex={currentImageIndex}
          onClose={() => setIsImageModalOpen(false)}
          onNavigate={navigateImage}
        />
      )}
      
      <div className="flex justify-center mt-8">
        <button 
          onClick={() => setShowComments(!showComments)} 
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-full shadow-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{showComments ? 'إخفاء التعليقات' : `عرض التعليقات (${comments.length})`}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showComments ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post.id} comments={comments} onAddComment={handleAddComment} />
      )}
    </div>
  );
}

