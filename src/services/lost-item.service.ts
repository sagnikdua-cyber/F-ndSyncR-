import { auth } from '@/lib/firebase/config';

export class LostItemService {
  /**
   * Submits a new lost item report
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async reportLostItem(data: FormData | any): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const token = await user.getIdToken();
      
      const isFormData = data instanceof FormData;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }
      
      const res = await fetch('/api/lost-items', {
        method: 'POST',
        headers,
        body: isFormData ? data : JSON.stringify(data)
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to report lost item' };
      }

      return { success: true, id: json.id };
    } catch (e: unknown) {
      const error = e as { message?: string };
      return { success: false, error: error.message || 'Network error' };
    }
  }

  /**
   * Fetches the lost items for the currently logged in student
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getMyLostItems(): Promise<{ success: boolean; items?: any[]; error?: string }> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const token = await user.getIdToken();
      
      const res = await fetch('/api/lost-items', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.error || 'Failed to fetch items' };
      }

      return { success: true, items: json.items };
    } catch (e: unknown) {
      const error = e as { message?: string };
      return { success: false, error: error.message || 'Network error' };
    }
  }
}
