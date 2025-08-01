import { supabase, Comment, NewComment } from '../lib/supabase';

export class CommentService {
  static async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`خطأ في جلب التعليقات: ${error.message}`);
    }

    return data || [];
  }

  static async createComment(comment: NewComment): Promise<Comment> {
    // Handle publication IDs that start with 'pub-' by extracting the UUID part
    let processedComment = { ...comment };
    
    // If post_id starts with 'pub-', we need to handle it properly
    if (comment.post_id.startsWith('pub-')) {
      // For now, we'll store the full publication ID as text
      // This requires the database to accept TEXT for post_id
      console.log('Processing publication comment for:', comment.post_id);
    }
    
    const { data, error } = await supabase
      .from('comments')
      .insert([processedComment])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw new Error(`خطأ في إنشاء التعليق: ${error.message}`);
    }

    return data;
  }

  static async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`خطأ في حذف التعليق: ${error.message}`);
    }
  }

  static async getAllCommentsForAdmin(): Promise<(Comment & { post_title: string })[]> {
    try {
      // Get all comments without joining to posts table
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Comments table does not exist, returning empty array');
          return [];
        }
        throw new Error(`خطأ في جلب التعليقات: ${error.message}`);
      }

      if (!commentsData || commentsData.length === 0) {
        return [];
      }

      // Get publications to match post titles
      let publicationsData: any[] = [];
      try {
        const { data: pubs } = await supabase
          .from('publications')
          .select('id, title');
        publicationsData = pubs || [];
      } catch (pubError) {
        console.warn('Could not load publications for comment titles:', pubError);
      }

      // Map comments with post titles
      const commentsWithTitles = commentsData.map(comment => {
        let post_title = 'منشور غير معروف';
        
        // Check if it's a publication comment (starts with 'pub-')
        if (comment.post_id.startsWith('pub-')) {
          const publicationId = comment.post_id.replace('pub-', '');
          const publication = publicationsData.find(pub => pub.id === publicationId);
          if (publication) {
            post_title = publication.title;
          }
        } else {
          // Handle regular post comments (if any exist in the future)
          post_title = 'منشور مجتمعي';
        }
        
        return {
          ...comment,
          post_title
        };
      });

      return commentsWithTitles;
    } catch (err) {
      console.error('Error in getAllCommentsForAdmin:', err);
      if (err instanceof Error && (err.message.includes('relation') || err.message.includes('table'))) {
        return [];
      }
      throw err;
    }
  }
}