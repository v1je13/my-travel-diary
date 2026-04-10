// Для VK Mini App и Vercel используем относительный путь для проксирования через Vercel
const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname.includes("vercel.app")
    ? "" // относительный путь для проксирования через Vercel
    : "https://traveldiary-api.traveldiary-api.workers.dev");
let apiAvailable = null;

async function checkApi() {
  if (apiAvailable !== null) return apiAvailable;
  try {
    // AbortSignal.timeout не поддерживается на Android < 10
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${API_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    apiAvailable = res.ok;
    console.log("API check result:", apiAvailable);
  } catch (e) {
    console.error("API check failed:", e);
    apiAvailable = false;
  }
  return apiAvailable;
}

// === Stories ===
export async function getStories() {
  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/stories`);
      return await res.json();
    } catch (e) {
      console.warn("API unavailable, using localStorage");
    }
  }
  return JSON.parse(localStorage.getItem("travelDiaryStories") || "[]");
}

export async function saveStory(story) {
  const localSaved = JSON.parse(
    localStorage.getItem("travelDiaryStories") || "[]",
  );

  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API save failed, using localStorage");
    }
  }

  localSaved.push(story);
  localStorage.setItem("travelDiaryStories", JSON.stringify(localSaved));
  return story;
}

export async function markStoryViewed(id) {
  if (await checkApi()) {
    try {
      await fetch(`${API_URL}/api/stories/${id}`, { method: "PUT" });
    } catch (e) {}
  }
}

export async function deleteStory(id) {
  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/stories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) return true;
    } catch (e) {
      console.warn("API delete failed, using localStorage");
    }
  }

  // Fallback: delete from localStorage
  const stories = JSON.parse(
    localStorage.getItem("travelDiaryStories") || "[]",
  );
  const filtered = stories.filter((s) => s.id !== id);
  localStorage.setItem("travelDiaryStories", JSON.stringify(filtered));
  return true;
}

// === Posts ===
export async function getPosts() {
  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/posts`);
      return await res.json();
    } catch (e) {
      console.warn("API unavailable, using localStorage");
    }
  }
  return JSON.parse(localStorage.getItem("travelDiaryFeedPosts") || "[]");
}

export async function getPostComments(postId) {
  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/posts/${postId}/comments`);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  // Fallback: from localStorage
  const all = JSON.parse(localStorage.getItem("travelDiaryComments") || "[]");
  return all.filter((c) => c.postId === postId);
}

export async function addComment(comment) {
  const localAll = JSON.parse(
    localStorage.getItem("travelDiaryComments") || "[]",
  );

  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API comment save failed, using localStorage");
    }
  }

  const saved = { ...comment, id: Date.now() };
  localAll.unshift(saved);
  localStorage.setItem("travelDiaryComments", JSON.stringify(localAll));
  return saved;
}

export async function savePost(post) {
  const localPosts = JSON.parse(
    localStorage.getItem("travelDiaryFeedPosts") || "[]",
  );

  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("API save failed, using localStorage");
    }
  }

  localPosts.unshift(post);
  localStorage.setItem("travelDiaryFeedPosts", JSON.stringify(localPosts));
  return post;
}

export async function likePost(id, userId) {
  if (await checkApi()) {
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
  if (await checkApi()) {
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (id) params.set("id", id);
      const res = await fetch(`${API_URL}/api/search?${params}`);
      return await res.json();
    } catch (e) {
      console.warn("API search failed, using localStorage");
    }
  }

  // Fallback: search in localStorage
  const posts = JSON.parse(
    localStorage.getItem("travelDiaryFeedPosts") || "[]",
  );
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
  if (await checkApi()) {
    try {
      const res = await fetch(`${API_URL}/api/posts/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  const posts = JSON.parse(
    localStorage.getItem("travelDiaryFeedPosts") || "[]",
  );
  return posts.find((p) => p.id === parseInt(id)) || null;
}

export async function checkHealth() {
  return checkApi();
}
