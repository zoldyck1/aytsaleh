import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function HomePageDebug() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebugInfo('Component mounted, starting to load posts...');
    loadPostsDebug();
  }, []);

  const loadPostsDebug = async () => {
    addDebugInfo('loadPostsDebug called');
    
    const timeoutId = setTimeout(() => {
      addDebugInfo('Timeout reached - forcing loading to false');
      setLoading(false);
      setError('انتهت مهلة الاتصال');
    }, 5000);

    try {
      setLoading(true);
      setError(null);
      addDebugInfo('Set loading to true');

      // Simple test without any service calls
      addDebugInfo('About to simulate data fetch...');
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addDebugInfo('Simulated fetch completed');
      
      // Test data
      const testPosts = [
        {
          id: '1',
          title: 'مرحباً بكم في موقع الجمعية',
          description: 'نرحب بجميع الزوار في موقع الجمعية الجديد.',
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          title: 'فعالية خيرية جديدة',
          description: 'تم تنظيم فعالية خيرية جديدة لمساعدة الأسر المحتاجة.',
          created_at: new Date().toISOString()
        }
      ];

      clearTimeout(timeoutId);
      setPosts(testPosts);
      addDebugInfo(`Set ${testPosts.length} test posts`);
      
    } catch (err) {
      addDebugInfo(`Error caught: ${err}`);
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setPosts([]);
    } finally {
      addDebugInfo('Setting loading to false in finally block');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner size="lg" />
        <p className="text-center text-gray-600 mt-4">جاري تحميل الأخبار...</p>
        <div className="mt-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-medium mb-4">Debug Information:</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm">
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage message={error} />
        <div className="text-center mt-4">
          <button
            onClick={loadPostsDebug}
            className="btn-primary"
          >
            إعادة المحاولة
          </button>
        </div>
        <div className="mt-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-medium mb-4">Debug Information:</h3>
          <div className="bg-gray-100 p-4 rounded-lg text-sm">
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">أحدث الأخبار والمنشورات</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          تابع آخر الأخبار والمقالات والتحديثات المهمة
        </p>
      </div>

      <div className="mb-8 max-w-2xl mx-auto">
        <h3 className="text-lg font-medium mb-4">Debug Information:</h3>
        <div className="bg-green-50 p-4 rounded-lg text-sm">
          {debugInfo.map((info, index) => (
            <div key={index} className="mb-1">{info}</div>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد منشورات حالياً</h3>
          <p className="text-gray-600">سيتم نشر المحتوى قريباً</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {post.description}
                </p>
                <div className="text-sm text-gray-500">
                  {new Date(post.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
