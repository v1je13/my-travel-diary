import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Panel, PanelHeader, Button } from "@vkontakte/vkui";
import { deleteStory } from "../services/api";
import { getCurrentUser } from "../components/StoriesBar";
import { APP_CONFIG, REACTION_EMOJIS } from "../constants/app";
import "../styles/vkStories.css";

const currentUser = getCurrentUser();

function formatTimestamp(timestamp) {
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

export default function StoryViewerVK({
  nav,
  stories = [],
  initialIndex = 0,
  onClose,
  onNextUser,
  onPrevUser,
  onEdit,
  onDelete,
  onReply,
  onMarkViewed,
  onPublish,
  userGroup = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [swipeDirection, setSwipeDirection] = useState(null);

  const videoRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimerRef = useRef(null);
  const currentStory = stories[currentIndex];

  // Video playback
  useEffect(() => {
    if (!currentStory || currentStory.type !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    setProgress(0);
    video.currentTime = 0;
    video.muted = isMuted;

    const onEnded = () => goToNext();
    const onTimeUpdate = () => {
      if (video.duration)
        setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.pause();
    };
  }, [currentIndex, currentStory?.video, isMuted]);

  // Photo auto-advance
  useEffect(() => {
    if (isPaused || !currentStory || currentStory.type === "video") return;
    setProgress(0);
    const increment = 100 / (APP_CONFIG.STORY_PHOTO_DURATION / 100);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goToNext();
          return 0;
        }
        return p + increment;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, currentStory]);

  // Mark as viewed
  useEffect(() => {
    if (currentStory && onMarkViewed) {
      onMarkViewed(currentIndex);
    }
  }, [currentIndex, currentStory]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Move to next user's stories
      if (onNextUser) {
        onNextUser();
      } else {
        onClose();
      }
    }
  }, [currentIndex, stories.length, onNextUser, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      // Move to previous user's stories
      if (onPrevUser) {
        onPrevUser();
      }
    }
  }, [currentIndex, onPrevUser]);

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Long press for pause
    longPressTimerRef.current = setTimeout(() => {
      setIsPaused(true);
    }, 300);
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current.x) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Detect vertical swipe for next/prev user
    if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (deltaY > 0 && onPrevUser) {
        setSwipeDirection("down");
      } else if (deltaY < 0 && onNextUser) {
        setSwipeDirection("up");
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    const deltaY =
      touchStartRef.current.y - (e.changedTouches?.[0]?.clientY || 0);
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Swipe detection
    if (Math.abs(deltaY) > 100 && deltaTime < 500) {
      if (deltaY > 0 && onNextUser) {
        onNextUser();
      } else if (deltaY < 0 && onPrevUser) {
        onPrevUser();
      }
    }

    setIsPaused(false);
    setSwipeDirection(null);
    touchStartRef.current = { x: 0, y: 0, time: 0 };
  };

  const handleDelete = async () => {
    if (currentStory && currentStory.authorId === currentUser.id) {
      await deleteStory(currentStory.id);
      // Remove from local list and navigate
      const remaining = stories.filter((s) => s.id !== currentStory.id);
      if (remaining.length === 0) {
        onClose();
      } else {
        const newIndex = Math.min(currentIndex, remaining.length - 1);
        setCurrentIndex(newIndex);
      }
    }
  };

  const handleTap = (side) => {
    if (showReactions) {
      setShowReactions(false);
      return;
    }
    side === "right" ? goToNext() : goToPrev();
  };

  const handleReaction = (emoji) => {
    if (onReply) {
      onReply(emoji);
    }
    setShowReactions(false);
  };

  const handleReplySubmit = () => {
    if (replyText && replyText.trim() && onReply) {
      onReply(replyText.trim());
      setReplyText("");
    }
  };

  if (!currentStory) {
    return (
      <div className="vk-story-viewer">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#fff",
          }}
        >
          История не найдена
        </div>
      </div>
    );
  }

  // Render multi-segment progress bar
  const renderProgressBar = () => {
    return (
      <div className="vk-story-progress-container">
        {stories.map((_, idx) => {
          let segmentClass = "vk-story-progress-segment";
          let fillWidth = "0%";

          if (idx < currentIndex) {
            segmentClass += " completed";
            fillWidth = "100%";
          } else if (idx === currentIndex) {
            fillWidth = `${progress}%`;
          }

          return (
            <div key={idx} className={segmentClass}>
              <div
                className="vk-story-progress-fill"
                style={{ width: fillWidth }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Panel nav={nav} style={{ padding: 0, background: "#000" }}>
      <div className="vk-story-viewer">
        {/* Header */}
        <div className="vk-story-viewer-header">
          {renderProgressBar()}
          <div className="vk-story-user-info">
            {currentStory.authorAvatar ? (
              <img
                src={currentStory.authorAvatar}
                alt={currentStory.authorName || "User"}
                className="vk-story-user-avatar"
              />
            ) : (
              <div className="vk-story-user-avatar-placeholder">
                {(currentStory.authorName || "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="vk-story-user-details">
              <div className="vk-story-user-name">
                {currentStory.authorName || currentStory.name || "Пользователь"}
              </div>
              <div className="vk-story-timestamp">
                {formatTimestamp(currentStory.timestamp || Date.now())}
              </div>
            </div>
            <button
              className="vk-story-more-btn"
              onClick={() => setShowReactions(!showReactions)}
            >
              😊
            </button>
            {currentStory.authorId === currentUser.id && (
              <>
                <button
                  className="vk-story-publish-btn"
                  onClick={() => onPublish?.(currentStory)}
                >
                  📤 Опубликовать
                </button>
                {onEdit && (
                  <button
                    className="vk-story-more-btn"
                    onClick={() => onEdit(currentStory)}
                  >
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button
                    className="vk-story-more-btn"
                    onClick={handleDelete}
                    style={{ color: "#ff4444" }}
                  >
                    🗑️
                  </button>
                )}
              </>
            )}
            <button className="vk-story-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="vk-story-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentStory.type === "video" && currentStory.video ? (
            <video
              ref={videoRef}
              src={currentStory.video}
              className="vk-story-video"
              playsInline
              muted={isMuted}
            />
          ) : currentStory.image ? (
            <img
              src={currentStory.image}
              alt="Story"
              className="vk-story-image"
            />
          ) : null}

          {/* Text overlay */}
          {currentStory.text && (
            <div className="vk-story-text-overlay">
              <div className="vk-story-text-content">{currentStory.text}</div>
            </div>
          )}

          {/* Swipe indicators */}
          {swipeDirection && (
            <div
              className={`vk-swipe-indicator visible ${
                swipeDirection === "up" ? "up" : "down"
              }`}
            >
              {swipeDirection === "up"
                ? "Следующая история ↑"
                : "Предыдущая история ↓"}
            </div>
          )}

          {/* Pause indicator */}
          {isPaused && (
            <div className="vk-pause-indicator visible">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Reactions popup */}
        {showReactions && (
          <div className="vk-story-reactions-popup">
            {REACTION_EMOJIS.map((emoji) => (
              <div
                key={emoji}
                className="vk-story-reaction-option"
                onClick={() => handleReaction(emoji)}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}

        {/* Reply bar */}
        <div className="vk-story-reply-bar">
          <input
            type="text"
            className="vk-story-reply-input"
            placeholder="Отправить реакцию..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleReplySubmit();
              }
            }}
          />
          <button
            className="vk-story-reaction-btn"
            onClick={() => setShowReactions(!showReactions)}
          >
            😊
          </button>
        </div>

        {/* Floating publish button for my stories */}
        {currentStory.isMine && (
          <button
            className="vk-story-floating-publish"
            onClick={() => onPublish?.(currentStory)}
          >
            📤 Опубликовать в ленту
          </button>
        )}

        {/* Tap areas */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            width: "40%",
            height: "calc(100% - 160px)",
            zIndex: 8,
          }}
          onClick={() => handleTap("left")}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 0,
            width: "60%",
            height: "calc(100% - 160px)",
            zIndex: 8,
          }}
          onClick={() => handleTap("right")}
        />
      </div>
      </Panel>
    );
}

StoryViewerVK.propTypes = {
  nav: PropTypes.string.isRequired,
  stories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      image: PropTypes.string,
      video: PropTypes.string,
      text: PropTypes.string,
      textColor: PropTypes.string,
      fontSize: PropTypes.number,
      stickers: PropTypes.array,
      timestamp: PropTypes.number.isRequired,
      type: PropTypes.oneOf(['photo', 'video']).isRequired,
      authorName: PropTypes.string.isRequired,
      authorId: PropTypes.string.isRequired,
      authorAvatar: PropTypes.string,
    })
  ).isRequired,
  initialIndex: PropTypes.number,
  authorId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
};
