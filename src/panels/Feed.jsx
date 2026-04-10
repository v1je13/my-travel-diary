import React, { useState, useEffect, useCallback } from "react";
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
  Textarea,
  Separator,
  FormItem,
  Div,
  PullToRefresh,
} from "@vkontakte/vkui";
import { Icon20Add, Icon24Camera } from "@vkontakte/icons";
import StoriesBar, {
  getCurrentUser,
  initUserFromVK,
} from "../components/StoriesBar";
import { getPosts, getStories, savePost, searchPosts } from "../api";
import { useVKUser } from "../hooks/useVKUser";
import "../styles/vkStories.css";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const currentUser = getCurrentUser();

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

  // Sync VK user name
  useEffect(() => {
    if (vkUser.user?.first_name) {
      const updated = initUserFromVK(vkUser.user);
      setCurrentUser(updated);
    }
  }, [vkUser.user]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [viewedStories, setViewedStories] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const stories = await getStories();
    const posts = await getPosts();
    const viewed = JSON.parse(
      localStorage.getItem("travelDiaryViewedStories") || "[]",
    );
    setMyStories(stories);
    setFeedPosts(posts);
    setViewedStories(new Set(viewed));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Load data from API
  useEffect(() => {
    loadData();

    // Refresh when VK app is opened
    vkBridge.subscribe((e) => {
      if (e.detail?.type === "VKWebAppInit") {
        loadData();
      }
    });
  }, []);

  // Reload data periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search handler
  const handleSearch = useCallback(async (value) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const isNumeric = /^\d+$/.test(value.trim());
    const results = await searchPosts(value, isNumeric ? value : null);
    setSearchResults(results);
    setIsSearching(false);
  }, []);

  // Filter posts when searching locally
  const displayPosts =
    searchQuery && !searchResults.length
      ? []
      : searchQuery && searchResults.length > 0
        ? searchResults
        : feedPosts;

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
          onChange={(e) => handleSearch(e.target.value)}
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
