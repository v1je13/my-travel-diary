/**
 * Константы приложения
 */

export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'https://traveldiary-api.traveldiary-api.workers.dev',
  CACHE_DURATION: 60000, // 1 минута
  API_TIMEOUT: 1500,
  STORY_PHOTO_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  AUTO_REFRESH_INTERVAL: 60000, // 1 минута
};

export const STORAGE_KEYS = {
  STORIES: 'travelDiaryStories',
  POSTS: 'travelDiaryFeedPosts',
  COMMENTS: 'travelDiaryComments',
  VIEWED_STORIES: 'travelDiaryViewedStories',
  LIKED_POSTS: 'travelDiaryLikedPosts',
  CURRENT_USER: 'travelDiaryCurrentUser',
};

export const STORY_COLORS = [
  '#ffffff',
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#4cd964',
  '#007aff',
  '#5856d6',
  '#ff2d55',
  '#000000',
];

export const FONT_SIZES = [16, 20, 24, 32, 40, 48];

export const STICKERS = [
  '😀', '😍', '🥳', '😎', '🤩', '😱', '🔥', '❤️', '💯', '👍',
  '🙌', '🎉', '✨', '🌟', '🎈', '📍', '✈️', '🌍', '🏖️', '🗺️',
  '📸', '🎬', '🎵',
];

export const GRADIENT_COLORS = [
  'linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)',
  'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  'linear-gradient(135deg, #00c6ff, #0072ff, #0052d4)',
  'linear-gradient(135deg, #11998e, #38ef7d)',
  'linear-gradient(135deg, #fc5c7d, #6a82fb)',
];

export const REACTION_EMOJIS = ['❤️', '😂', '😮', '🔥', '👍', '😊'];
