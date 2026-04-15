/**
 * API сервис с улучшенной обработкой ошибок и кэшированием
 */

import { APP_CONFIG, STORAGE_KEYS } from '../constants/app';

class ApiError extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class ApiService {
  constructor() {
    this.cache = {
      stories: null,
      posts: null,
      comments: {},
      lastFetch: { stories: 0, posts: 0 },
    };
    this.apiAvailable = null;
    this.apiCheckPromise = null;
  }

  /**
   * Проверка доступности API с таймаутом
   */
  async checkApi() {
    if (this.apiAvailable !== null) {
      return Promise.resolve(this.apiAvailable);
    }
    
    if (this.apiCheckPromise) {
      return this.apiCheckPromise;
    }

    this.apiCheckPromise = new Promise((resolve) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.API_TIMEOUT);

      fetch(`${APP_CONFIG.API_URL}/api/health`, { signal: controller.signal })
        .then((res) => {
          clearTimeout(timeoutId);
          this.apiAvailable = res.ok;
          resolve(this.apiAvailable);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          this.apiAvailable = false;
          resolve(false);
        });
    });

    return this.apiCheckPromise;
  }

  /**
   * Получение данных из localStorage с обработкой ошибок
   */
  getFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from storage (${key}):`, error);
      return [];
    }
  }

  /**
   * Сохранение данных в localStorage с обработкой ошибок
   */
  saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to storage (${key}):`, error);
    }
  }

  /**
   * Проверка необходимости обновления кэша
   */
  shouldRefresh(lastFetchTime) {
    const now = Date.now();
    return now - lastFetchTime > APP_CONFIG.CACHE_DURATION;
  }

  /**
   * Получение историй с кэшированием и fallback
   */
  async getStories(forceRefresh = false) {
    const now = Date.now();

    // Возвращаем кэш если актуален
    if (!forceRefresh && this.cache.stories && !this.shouldRefresh(this.cache.lastFetch.stories)) {
      return this.cache.stories;
    }

    // Пробуем API если доступен
    const apiOk = await this.checkApi();
    if (apiOk) {
      try {
        const response = await fetch(`${APP_CONFIG.API_URL}/api/stories`);
        if (response.ok) {
          const data = await response.json();
          this.cache.stories = data;
          this.cache.lastFetch.stories = now;
          return data;
        }
      } catch (error) {
        console.warn('API stories fetch failed:', error);
      }
    }

    // Fallback на localStorage
    const localData = this.getFromStorage(STORAGE_KEYS.STORIES);
    this.cache.stories = localData;
    this.cache.lastFetch.stories = now;
    return localData;
  }

  /**
   * Сохранение истории с синхронизацией
   */
  async saveStory(story) {
    // Мгновенное сохранение в localStorage
    const localStories = this.getFromStorage(STORAGE_KEYS.STORIES);
    const updatedStory = { ...story, timestamp: story.timestamp || Date.now() };
    
    const existingIndex = localStories.findIndex(s => s.id === story.id);
    if (existingIndex >= 0) {
      localStories[existingIndex] = updatedStory;
    } else {
      localStories.push(updatedStory);
    }
    
    this.saveToStorage(STORAGE_KEYS.STORIES, localStories);

    // Обновляем кэш
    if (this.cache.stories) {
      this.cache.stories = [...localStories];
    }

    // Фоновая синхронизация с API
    this.checkApi().then((apiOk) => {
      if (apiOk) {
        fetch(`${APP_CONFIG.API_URL}/api/stories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(story),
        }).catch((error) => {
          console.warn('Failed to sync story to API:', error);
        });
      }
    });

    return updatedStory;
  }

  /**
   * Удаление истории
   */
  async deleteStory(id) {
    // Мгновенное удаление из localStorage
    const stories = this.getFromStorage(STORAGE_KEYS.STORIES);
    const filtered = stories.filter(s => s.id !== id);
    this.saveToStorage(STORAGE_KEYS.STORIES, filtered);

    // Обновляем кэш
    if (this.cache.stories) {
      this.cache.stories = filtered;
    }

    // Фоновое удаление из API
    this.checkApi().then((apiOk) => {
      if (apiOk) {
        fetch(`${APP_CONFIG.API_URL}/api/stories/${id}`, { method: 'DELETE' }).catch(() => {});
      }
    });

    return true;
  }

  /**
   * Получение постов
   */
  async getPosts(forceRefresh = false) {
    const now = Date.now();

    if (!forceRefresh && this.cache.posts && !this.shouldRefresh(this.cache.lastFetch.posts)) {
      return this.cache.posts;
    }

    const apiOk = await this.checkApi();
    if (apiOk) {
      try {
        const response = await fetch(`${APP_CONFIG.API_URL}/api/posts`);
        if (response.ok) {
          const data = await response.json();
          this.cache.posts = data;
          this.cache.lastFetch.posts = now;
          return data;
        }
      } catch (error) {
        console.warn('API posts fetch failed:', error);
      }
    }

    const localData = this.getFromStorage(STORAGE_KEYS.POSTS);
    this.cache.posts = localData;
    this.cache.lastFetch.posts = now;
    return localData;
  }

  /**
   * Сохранение поста
   */
  async savePost(post) {
    const localPosts = this.getFromStorage(STORAGE_KEYS.POSTS);
    const updatedPost = { ...post, id: post.id || Date.now() };
    
    const existingIndex = localPosts.findIndex(p => p.id === updatedPost.id);
    if (existingIndex >= 0) {
      localPosts[existingIndex] = updatedPost;
    } else {
      localPosts.unshift(updatedPost);
    }
    
    this.saveToStorage(STORAGE_KEYS.POSTS, localPosts);

    if (this.cache.posts) {
      this.cache.posts = [...localPosts];
    }

    this.checkApi().then((apiOk) => {
      if (apiOk) {
        fetch(`${APP_CONFIG.API_URL}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPost),
        }).catch(() => {});
      }
    });

    return updatedPost;
  }

  /**
   * Получение комментариев к посту
   */
  async getPostComments(postId) {
    const apiOk = await this.checkApi();
    if (apiOk) {
      try {
        const response = await fetch(`${APP_CONFIG.API_URL}/api/posts/${postId}/comments`);
        if (response.ok) {
          const data = await response.json();
          this.cache.comments[postId] = data;
          return data;
        }
      } catch (error) {
        console.warn('API comments fetch failed:', error);
      }
    }

    if (this.cache.comments[postId]) return this.cache.comments[postId];

    const allComments = this.getFromStorage(STORAGE_KEYS.COMMENTS);
    const filtered = allComments.filter(c => c.postId === postId);
    this.cache.comments[postId] = filtered;
    return filtered;
  }

  /**
   * Добавление комментария
   */
  async addComment(comment) {
    const saved = { ...comment, id: comment.id || Date.now() };
    const allComments = this.getFromStorage(STORAGE_KEYS.COMMENTS);
    allComments.unshift(saved);
    this.saveToStorage(STORAGE_KEYS.COMMENTS, allComments);

    if (this.cache.comments[comment.postId]) {
      this.cache.comments[comment.postId].unshift(saved);
    }

    this.checkApi().then((apiOk) => {
      if (apiOk) {
        fetch(`${APP_CONFIG.API_URL}/api/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(comment),
        }).catch(() => {});
      }
    });

    return saved;
  }

  /**
   * Лайк поста
   */
  async likePost(id, userId) {
    const apiOk = await this.checkApi();
    if (apiOk) {
      try {
        const response = await fetch(`${APP_CONFIG.API_URL}/api/posts/${id}/like`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        if (response.ok) return await response.json();
      } catch (error) {
        console.warn('API like failed:', error);
      }
    }
    return null;
  }

  /**
   * Поиск постов
   */
  async searchPosts(query, id) {
    const apiOk = await this.checkApi();
    if (apiOk) {
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (id) params.set('id', id);
        
        const response = await fetch(`${APP_CONFIG.API_URL}/api/search?${params}`);
        if (response.ok) return await response.json();
      } catch (error) {
        console.warn('API search failed:', error);
      }
    }

    // Локальный поиск
    const posts = this.cache.posts || this.getFromStorage(STORAGE_KEYS.POSTS);
    if (id) {
      return posts.filter(p => p.id === parseInt(id));
    }
    if (query) {
      const q = query.toLowerCase();
      return posts.filter(
        p => (p.text && p.text.toLowerCase().includes(q)) || 
             (p.author && p.author.toLowerCase().includes(q))
      );
    }
    return [];
  }

  /**
   * Получение поста по ID
   */
  async getPostById(id) {
    const apiOk = await this.checkApi();
    if (apiOk) {
      try {
        const response = await fetch(`${APP_CONFIG.API_URL}/api/posts/${id}`);
        if (response.ok) return await response.json();
      } catch (error) {
        console.warn('API get post failed:', error);
      }
    }

    const posts = this.cache.posts || this.getFromStorage(STORAGE_KEYS.POSTS);
    return posts.find(p => p.id === parseInt(id)) || null;
  }

  /**
   * Проверка здоровья API
   */
  async checkHealth() {
    return this.checkApi();
  }
}

// Экспорт singleton экземпляра
export const apiService = new ApiService();

// Экспорт функций для обратной совместимости
export const getStories = (forceRefresh) => apiService.getStories(forceRefresh);
export const saveStory = (story) => apiService.saveStory(story);
export const deleteStory = (id) => apiService.deleteStory(id);
export const getPosts = (forceRefresh) => apiService.getPosts(forceRefresh);
export const savePost = (post) => apiService.savePost(post);
export const getPostComments = (postId) => apiService.getPostComments(postId);
export const addComment = (comment) => apiService.addComment(comment);
export const likePost = (id, userId) => apiService.likePost(id, userId);
export const searchPosts = (query, id) => apiService.searchPosts(query, id);
export const getPostById = (id) => apiService.getPostById(id);
export const checkHealth = () => apiService.checkHealth();
