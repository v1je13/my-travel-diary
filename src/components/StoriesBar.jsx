import React, { useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { getGradientColor, GRADIENT_COLORS, STORAGE_KEYS } from "../constants/app";
import { useLocalStorageSet } from "../hooks/useLocalStorage";
import "../styles/vkStories.css";

export function getCurrentUser() {
  try {
    let user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!user) {
      const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      user = JSON.stringify({
        id,
        firstName: "Вы",
        lastName: "",
        displayName: "Вы",
      });
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user);
    }
    return JSON.parse(user);
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      id: `user_${Date.now()}`,
      firstName: "Вы",
      lastName: "",
      displayName: "Вы",
    };
  }
}

export function initUserFromVK(vkUser) {
  if (!vkUser || !vkUser.first_name) return getCurrentUser();

  const current = getCurrentUser();

  if (current.displayName === "Вы" || current.displayName.includes("#")) {
    const updated = {
      ...current,
      firstName: vkUser.first_name,
      lastName: vkUser.last_name || "",
      displayName: `${vkUser.first_name} ${vkUser.last_name || ""}`,
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
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
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
  return updated;
};

export default React.memo(function StoriesBar({
  stories = [],
  myStories = [],
  onCreateStory,
  onViewStory,
  viewedStories = new Set(),
  currentUser: propUser,
}) {
  const longPressTimerRef = useRef(null);
  const currentUser = propUser || getCurrentUser();

  // Memoize story grouping to avoid recalculation on every render
  const allGroups = useMemo(() => {
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

    return [myStoryGroup, ...Object.values(groupedStories)];
  }, [stories, myStories, currentUser.id, currentUser.firstName]);

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
});

StoriesBar.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.object),
  myStories: PropTypes.arrayOf(PropTypes.object),
  onCreateStory: PropTypes.func,
  onViewStory: PropTypes.func,
  viewedStories: PropTypes.instanceOf(Set),
  currentUser: PropTypes.object,
};
