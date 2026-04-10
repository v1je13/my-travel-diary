// Для VK Mini App используем Vercel API proxy чтобы избежать CORS проблем
const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname.includes("vercel.app")
    ? "" // используем относительный путь для Vercel proxy
    : "https://traveldiary-api.traveldiary-api.workers.dev");

// Кэш для данных
const dataCache = {
  stories: null,
  posts: null,
  comments: {},
  lastFetch: { stories: 0, posts: 0 },
};

// Флаг доступности API (проверяем один раз асинхронно)
let apiAvailable = null;
let apiCheckPromise = null;

function checkApi() {
  if (apiAvailable !== null) return Promise.resolve(apiAvailable);
  if (apiCheckPromise) return apiCheckPromise;

  apiCheckPromise = new Promise((resolve) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    fetch(`${API_URL}/api/health`, { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        apiAvailable = res.ok;
        resolve(apiAvailable);
      })
      .catch(() => {
        clearTimeout(timeoutId);
        apiAvailable = false;
        resolve(false);
      });
  });

  return apiCheckPromise;
}

// Запускаем проверку API в фоне сразу
checkApi();

function getFromStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

// === Stories ===
export async function getStories(forceRefresh = false) {
  const now = Date.now();

  // Возвращаем кэш если есть и не требуется обновление
  if (
    !forceRefresh &&
    dataCache.stories &&
    now - dataCache.lastFetch.stories < 60000
  ) {
    return dataCache.stories;
  }

  // Пробуем API если доступен
  const apiOk = await checkApi();
  if (apiOk) {
    try {
      const res = await fetch(`${API_URL}/api/stories`);
      if (res.ok) {
        const data = await res.json();
        dataCache.stories = data;
        dataCache.lastFetch.stories = now;
        return data;
      }
    } catch (e) {
      console.warn("API stories fetch failed");
    }
  }

  // Fallback на localStorage
  const localData = getFromStorage("travelDiaryStories");
  dataCache.stories = localData;
  dataCache.lastFetch.stories = now;
  return localData;
}

export function saveStory(story) {
  // Мгновенно сохраняем в localStorage
  const localSaved = getFromStorage("travelDiaryStories");
  localSaved.push(story);
  localStorage.setItem("travelDiaryStories", JSON.stringify(localSaved));

  // Обновляем кэш
  if (dataCache.stories) {
    dataCache.stories.push(story);
  }

  // В фоне отправляем в API (не ждём!)
  checkApi().then((apiOk) => {
    if (apiOk) {
      fetch(`${API_URL}/api/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      }).catch(() => {});
    }
  });

  return story;
}

export async function markStoryViewed(id) {
  const apiOk = await checkApi();
  if (apiOk) {
    fetch(`${API_URL}/api/stories/${id}`, { method: "PUT" }).catch(() => {});
  }
}

export function deleteStory(id) {
  // Мгновенно удаляем из localStorage
  const stories = getFromStorage("travelDiaryStories");
  const filtered = stories.filter((s) => s.id !== id);
  localStorage.setItem("travelDiaryStories", JSON.stringify(filtered));

  // Обновляем кэш
  if (dataCache.stories) {
    dataCache.stories = dataCache.stories.filter((s) => s.id !== id);
  }

  // В фоне удаляем из API
  checkApi().then((apiOk) => {
    if (apiOk) {
      fetch(`${API_URL}/api/stories/${id}`, { method: "DELETE" }).catch(
        () => {},
      );
    }
  });

  return true;
}

// === Posts ===
export async function getPosts(forceRefresh = false) {
  const now = Date.now();

  if (
    !forceRefresh &&
    dataCache.posts &&
    now - dataCache.lastFetch.posts < 60000
  ) {
    return dataCache.posts;
  }

  const apiOk = await checkApi();
  if (apiOk) {
    try {
      const res = await fetch(`${API_URL}/api/posts`);
      if (res.ok) {
        const data = await res.json();
        dataCache.posts = data;
        dataCache.lastFetch.posts = now;
        return data;
      }
    } catch (e) {
      console.warn("API posts fetch failed");
    }
  }

  const localData = getFromStorage("travelDiaryFeedPosts");
  dataCache.posts = localData;
  dataCache.lastFetch.posts = now;
  return localData;
}

export async function getPostComments(postId) {
  const apiOk = await checkApi();
  if (apiOk) {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        dataCache.comments[postId] = data;
        return data;
      }
    } catch (e) {}
  }

  if (dataCache.comments[postId]) return dataCache.comments[postId];

  const all = getFromStorage("travelDiaryComments");
  const filtered = all.filter((c) => c.postId === postId);
  dataCache.comments[postId] = filtered;
  return filtered;
}

export function addComment(comment) {
  const saved = { ...comment, id: Date.now() };
  const localAll = getFromStorage("travelDiaryComments");
  localAll.unshift(saved);
  localStorage.setItem("travelDiaryComments", JSON.stringify(localAll));

  // Обновляем кэш
  if (dataCache.comments[comment.postId]) {
    dataCache.comments[comment.postId].unshift(saved);
  }

  // В фоне отправляем в API
  checkApi().then((apiOk) => {
    if (apiOk) {
      fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      }).catch(() => {});
    }
  });

  return saved;
}

export function savePost(post) {
  // Мгновенно в localStorage
  const localPosts = getFromStorage("travelDiaryFeedPosts");
  localPosts.unshift(post);
  localStorage.setItem("travelDiaryFeedPosts", JSON.stringify(localPosts));

  // Обновляем кэш
  if (dataCache.posts) {
    dataCache.posts.unshift(post);
  }

  // В фоне в API
  checkApi().then((apiOk) => {
    if (apiOk) {
      fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      }).catch(() => {});
    }
  });

  return post;
}

export async function likePost(id, userId) {
  const apiOk = await checkApi();
  if (apiOk) {
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  return null;
}

// === Search ===
export async function searchPosts(query, id) {
  const apiOk = await checkApi();
  if (apiOk) {
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (id) params.set("id", id);
      const res = await fetch(`${API_URL}/api/search?${params}`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API search failed");
    }
  }

  // Fallback на localStorage
  const posts = dataCache.posts || getFromStorage("travelDiaryFeedPosts");
  if (id) {
    return posts.filter((p) => p.id === parseInt(id));
  }
  if (query) {
    const q = query.toLowerCase();
    return posts.filter(
      (p) =>
        (p.text && p.text.toLowerCase().includes(q)) ||
        (p.author && p.author.toLowerCase().includes(q)),
    );
  }
  return [];
}

export async function getPostById(id) {
  const apiOk = await checkApi();
  if (apiOk) {
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  const posts = dataCache.posts || getFromStorage("travelDiaryFeedPosts");
  return posts.find((p) => p.id === parseInt(id)) || null;
}

export function checkHealth() {
  return checkApi();
}
