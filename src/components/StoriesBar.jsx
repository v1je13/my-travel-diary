import React, { useRef } from "react";
import "../styles/vkStories.css";

const GRADIENT_COLORS = [
  "linear-gradient(135deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)",
  "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
  "linear-gradient(135deg, #00c6ff, #0072ff, #0052d4)",
  "linear-gradient(135deg, #11998e, #38ef7d)",
  "linear-gradient(135deg, #fc5c7d, #6a82fb)",
];

function getGradientColor(id) {
  const num =
    typeof id === "string"
      ? id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
      : id;
  return GRADIENT_COLORS[num % GRADIENT_COLORS.length];
}

const FIRST_NAMES = [
  "Александр",
  "Мария",
  "Дмитрий",
  "Елена",
  "Сергей",
  "Анна",
  "Алексей",
  "Ольга",
  "Михаил",
  "Наталья",
  "Андрей",
  "Екатерина",
  "Иван",
  "Татьяна",
  "Николай",
  "Ирина",
  "Павел",
  "Светлана",
  "Владимир",
  "Юлия",
  "Денис",
  "Виктория",
  "Роман",
  "Полина",
];
const LAST_NAMES = [
  "Иванов",
  "Петров",
  "Сидоров",
  "Козлов",
  "Смирнов",
  "Кузнецов",
  "Попов",
  "Васильев",
  "Новиков",
  "Морозов",
  "Волков",
  "Соколов",
  "Лебедев",
  "Семёнов",
  "Егоров",
  "Павлов",
  "Козлов",
  "Степанов",
  "Николаев",
  "Орлов",
  "Андреев",
  "Макаров",
  "Никитин",
  "Захаров",
];

function generateRandomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const num = Math.floor(Math.random() * 100);
  return {
    firstName: first,
    lastName: last,
    displayName: `${first} ${last} #${num}`,
  };
}

export function getCurrentUser() {
  let user = localStorage.getItem("travelDiaryCurrentUser");
  if (!user) {
    // По умолчанию используем просто "Вы" без случайных имён
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    user = JSON.stringify({
      id,
      firstName: "Вы",
      lastName: "",
      displayName: "Вы",
    });
    localStorage.setItem("travelDiaryCurrentUser", user);
  }
  return JSON.parse(user);
}

export function initUserFromVK(vkUser) {
  if (!vkUser || !vkUser.first_name) return getCurrentUser();

  const current = getCurrentUser();

  // Обновляем имя только если сейчас используется "Вы" или случайное имя
  if (current.displayName === "Вы" || current.displayName.includes("#")) {
    const updated = {
      ...current,
      firstName: vkUser.first_name,
      lastName: vkUser.last_name || "",
      displayName: `${vkUser.first_name} ${vkUser.last_name || ""}`,
    };
    localStorage.setItem("travelDiaryCurrentUser", JSON.stringify(updated));
    return updated;
  }

  return current;
}

export function setCurrentUserNames(firstName, lastName) {
  const current = getCurrentUser();
  const updated = {
    ...current,
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`,
  };
  localStorage.setItem("travelDiaryCurrentUser", JSON.stringify(updated));
  return updated;
}

export default function StoriesBar({
  stories = [],
  myStories = [],
  onCreateStory,
  onViewStory,
  viewedStories = new Set(),
  currentUser: propUser,
}) {
  const longPressTimerRef = useRef(null);
  const currentUser = propUser || getCurrentUser();

  // Create "My Story" group
  const myStoryGroup = {
    id: currentUser.id,
    name: currentUser.firstName,
    avatar: null,
    stories: myStories,
    isMine: true,
  };

  // Group stories by unique authorId
  const groupedStories = {};
  stories.forEach((story) => {
    if (story.authorId === currentUser.id) return;
    const userId = story.authorId;
    if (!groupedStories[userId]) {
      groupedStories[userId] = {
        id: userId,
        name: story.authorName || "Пользователь",
        avatar: story.authorAvatar,
        stories: [],
        timestamp: story.timestamp,
      };
    }
    groupedStories[userId].stories.push(story);
    if (story.timestamp > groupedStories[userId].timestamp) {
      groupedStories[userId].timestamp = story.timestamp;
    }
  });

  const allGroups = [myStoryGroup, ...Object.values(groupedStories)];

  const handleStoryClick = (group) => {
    if (group.isMine) {
      if (myStories.length > 0) {
        onViewStory(myStories, 0, "mine");
      } else {
        onCreateStory(false);
      }
    } else {
      onViewStory(group.stories, 0, group.id);
    }
  };

  const handleAddToStory = (e) => {
    e.stopPropagation();
    onCreateStory(true);
  };

  const handleTouchStart = (group) => {
    if (group.isMine && group.stories.length > 0) {
      longPressTimerRef.current = setTimeout(() => {
        onCreateStory(true);
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  };

  return (
    <div className="vk-stories-bar">
      <div className="vk-stories-scroll">
        <div className="vk-stories-list">
          {allGroups.map((group) => {
            const hasStories = group.stories.length > 0;
            const isViewed = hasStories && viewedStories.has(group.id);
            const gradientColor = getGradientColor(group.id);
            const storyCount = group.stories.length;

            return (
              <div
                key={group.id}
                className="vk-story-item"
                onClick={() => handleStoryClick(group)}
                onTouchStart={() => handleTouchStart(group)}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="vk-story-ring"
                  style={{
                    background: !hasStories
                      ? "transparent"
                      : isViewed
                        ? "rgba(255,255,255,0.2)"
                        : gradientColor,
                    padding: hasStories ? "3px" : "0",
                  }}
                >
                  <div
                    className="vk-story-avatar-wrapper"
                    style={{
                      border: !hasStories
                        ? "2px solid rgba(255,255,255,0.2)"
                        : "2px solid #000",
                    }}
                  >
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="vk-story-avatar"
                      />
                    ) : (
                      <div className="vk-story-avatar-placeholder">
                        {group.isMine
                          ? "Вы"
                          : group.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {group.isMine && (
                      <div className="vk-story-add" onClick={handleAddToStory}>
                        +
                      </div>
                    )}
                  </div>
                </div>

                {/* Story count dots */}
                {hasStories && storyCount > 1 && (
                  <div className="vk-story-dots">
                    {Array.from({ length: Math.min(storyCount, 5) }).map(
                      (_, idx) => (
                        <div
                          key={idx}
                          className={`vk-story-dot ${viewedStories.has(`${group.id}-${idx}`) ? "viewed" : ""}`}
                        />
                      ),
                    )}
                  </div>
                )}

                <div className="vk-story-name">{group.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
