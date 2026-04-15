/**
 * Утилиты проекта
 */

import { APP_CONFIG } from '../constants/app';

/**
 * Утилита для склонения слова "день" в зависимости от числа
 */
export function getDaysWord(days) {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "дней";
  }

  switch (lastDigit) {
    case 1:
      return "день";
    case 2:
    case 3:
    case 4:
      return "дня";
    default:
      return "дней";
  }
}

/**
 * Функция debounce для отложенного выполнения
 */
export function debounce(fn, delay = APP_CONFIG.DEBOUNCE_DELAY) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Форматирование timestamp в читаемый формат
 */
export function formatTimestamp(timestamp) {
  const now = new Date();
  const storyTime = new Date(timestamp);
  const diffMs = now - storyTime;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "только что";
  } else if (diffHours < 24) {
    return `${diffHours} ч.`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} д.`;
  }
}

/**
 * Получение градиента цвета на основе ID
 */
export function getGradientColor(id, gradientColors) {
  const num = typeof id === "string"
    ? id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    : id;
  return gradientColors[num % gradientColors.length];
}

/**
 * Генерация уникального ID
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
