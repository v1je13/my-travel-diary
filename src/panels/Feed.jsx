import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import vkBridge from "@vkontakte/vk-bridge";
import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Group,
  Placeholder,
  Card,
  Title,
  Text,
  Link,
  Image,
  Avatar,
  Search,
  Button,
  Div,
  PullToRefresh,
} from "@vkontakte/vkui";
import { Icon20Add } from "@vkontakte/icons";
import StoriesBar, {
  getCurrentUser,
  initUserFromVK,
} from "../components/StoriesBar";
import { getPosts, getStories, searchPosts } from "../services/api";
import { useVKUser } from "../hooks/useVKUser";
import { useLocalStorageSet } from "../hooks/useLocalStorage";
import { useDebounce } from "../hooks/useDebounce";
import { APP_CONFIG, STORAGE_KEYS } from "../constants/app";
import "../styles/vkStories.css";

export default function Feed({
  nav,
  onOpenPost,
  onCreateStory,
  onViewStory,
  onEditStory,
  onOpenCreatePost,
}) {
  const vkUser = useVKUser();
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [feedPosts, setFeedPosts] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  // Используем кастомный хук для viewedStories
  const [viewedStories, addToViewed, removeFromViewed] = useLocalStorageSet(STORAGE_KEYS.VIEWED_STORIES);

  const loadData = async () => {
    if (!isMountedRef.current) return;

    try {
      const [stories, posts] = await Promise.all([getStories(), getPosts()]);

      if (isMountedRef.current) {
        setMyStories(stories);
        setFeedPosts(posts);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    // Refresh when VK app is opened
    const unsubscribe = vkBridge.subscribe((e) => {
      if (e.detail?.type === "VKWebAppInit") {
        loadData();
      }
    });

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Reload data periodically ONLY when page is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && isMountedRef.current) {
        loadData();
      }
    }, APP_CONFIG.AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Используем кастомный хук для debounce
  const debouncedSearchQuery = useDebounce(searchQuery, APP_CONFIG.DEBOUNCE_DELAY);

  // Search handler
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const isNumeric = /^\d+$/.test(debouncedSearchQuery.trim());
        const results = await searchPosts(debouncedSearchQuery, isNumeric ? debouncedSearchQuery : null);

        if (isMountedRef.current) {
          setSearchResults(results);
          setIsSearching(false);
        }
      } catch (error) {
        console.error('Search error:', error);
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  // Filter posts when searching locally
  const displayPosts = useMemo(() => {
    if (searchQuery && !searchResults.length) return [];
    if (searchQuery && searchResults.length > 0) return searchResults;
    return feedPosts;
  }, [searchQuery, searchResults, feedPosts]);

  return (
    <Panel nav={nav} style={{ background: "#f5f0e8" }}>
      {/* Header */}
      <PanelHeader
        after={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              onClick={() => onCreateStory?.()}
              style={{ cursor: "pointer" }}
              title="Создать историю"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <PanelHeaderButton
              onClick={() => onOpenCreatePost?.()}
              title="Опубликовать запись"
            >
              <Icon20Add />
            </PanelHeaderButton>
          </div>
        }
      >
        Лента
      </PanelHeader>

      {/* Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={refreshing}>
        {/* Search Bar */}
        <Search
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по ID или тексту..."
        />

        {/* Stories */}
        <StoriesBar
          stories={myStories}
          myStories={myStories.filter((s) => s.authorId === currentUser.id)}
          onCreateStory={onCreateStory}
          onViewStory={onViewStory}
          viewedStories={viewedStories}
          currentUser={currentUser}
        />

        {/* Create Post Button */}
        <Div>
          <Button
            stretched
            size="l"
            mode="primary"
            before={<Icon20Add />}
            onClick={() => onOpenCreatePost?.()}
          >
            Создать запись
          </Button>
        </Div>

        {/* Feed */}
        <Group
          mode="plain"
          style={{ background: "transparent", padding: "0 16px" }}
        >
          {isSearching ? (
            <Placeholder>Поиск...</Placeholder>
          ) : displayPosts.length === 0 && searchQuery ? (
            <Placeholder header="Ничего не найдено">
              Попробуйте изменить запрос
            </Placeholder>
          ) : displayPosts.length === 0 ? (
            <Placeholder header="Лента пуста">
              Будьте первым, кто поделится впечатлениями!
            </Placeholder>
          ) : (
            displayPosts.map((item) => (
              <Card
                key={item.id}
                mode="shadow"
                style={{ marginBottom: 16, padding: 16, cursor: "pointer" }}
                onClick={() => onOpenPost?.(item)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Avatar size={48} src={item.avatar} mode="circle" />
                  <div style={{ marginLeft: 12 }}>
                    <Title level="3" style={{ fontSize: 16 }}>
                      {item.author || "Вы"}
                    </Title>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "var(--vkui--color_text_secondary)",
                      }}
                    >
                      #{item.id} • {item.date || "только что"}
                    </Text>
                  </div>
                </div>

                {/* Title */}
                {item.title && (
                  <Title level="2" style={{ fontSize: 18, marginBottom: 8 }}>
                    {item.title}
                  </Title>
                )}

                {item.text && (
                  <Text style={{ marginBottom: 12, lineHeight: 1.4 }}>
                    {item.text}
                  </Text>
                )}

                {item.video && (
                  <video
                    src={item.video}
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      marginBottom: 12,
                      maxHeight: 300,
                      objectFit: "cover",
                    }}
                    controls
                    playsInline
                  />
                )}
                {item.image && !item.video && (
                  <Image
                    src={item.image}
                    alt=""
                    style={{
                      width: "100%",
                      borderRadius: 12,
                      marginBottom: 12,
                      maxHeight: 300,
                      objectFit: "cover",
                    }}
                  />
                )}

                <Link style={{ display: "block" }}>Далее</Link>
              </Card>
            ))
          )}
        </Group>
      </PullToRefresh>
    </Panel>
  );
}

Feed.propTypes = {
  nav: PropTypes.string.isRequired,
  onOpenPost: PropTypes.func,
  onCreateStory: PropTypes.func,
  onViewStory: PropTypes.func,
  onEditStory: PropTypes.func,
  onOpenCreatePost: PropTypes.func,
};
