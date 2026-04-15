import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewedStories, addToViewed, removeFromViewed, hasViewed] =
    useLocalStorageSet(STORAGE_KEYS.VIEWED_STORIES);
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = getCurrentUser();
  const vkUser = useVKUser();
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (vkUser) {
      initUserFromVK(vkUser);
    }
  }, [vkUser]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, APP_CONFIG.AUTO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsData, storiesData] = await Promise.all([
        getPosts(),
        getStories(),
      ]);
      setPosts(postsData || []);
      setStories(storiesData || []);
      setMyStories(
        (storiesData || []).filter((s) => s.authorId === currentUser.id),
      );
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Debounced search
  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      if (query && query.trim()) {
        const results = await searchPosts(query);
        setPosts(results || []);
      } else {
        loadData();
      }
    }, APP_CONFIG.DEBOUNCE_DELAY);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(searchTimeoutRef.current);
  }, []);

  if (loading) {
    return (
      <Panel nav={nav}>
        <Placeholder>Загрузка...</Placeholder>
      </Panel>
    );
  }

  return (
    <Panel nav={nav}>
      <PullToRefresh onRefresh={onRefresh} isRefreshing={refreshing}>
        <StoriesBar
          stories={stories}
          myStories={myStories}
          onCreateStory={onCreateStory}
          onViewStory={onViewStory}
          viewedStories={viewedStories}
          currentUser={currentUser}
        />
        <Div style={{ paddingBottom: 20 }}>
          <Search
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Поиск по ID или тексту..."
          />
        </Div>
        {posts.length === 0 ? (
          <Group>
            <Placeholder>Нет постов</Placeholder>
          </Group>
        ) : (
          <Group>
            {posts.map((post) => (
              <Card
                key={post.id}
                mode="shadow"
                style={{ marginBottom: 12 }}
                onClick={() => onOpenPost && onOpenPost(post)}
              >
                <Div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Avatar
                      size={40}
                      src={
                        post.avatar || "https://vk.com/images/camera_100.png"
                      }
                    />
                    <div style={{ marginLeft: 12 }}>
                      <Title level="3" style={{ fontSize: 16 }}>
                        {post.author || "Вы"}
                      </Title>
                      <Text
                        style={{
                          color: "var(--vkui--color_text_secondary)",
                          fontSize: 12,
                        }}
                      >
                        #{post.id} • {post.date || "только что"}
                      </Text>
                    </div>
                  </div>
                  {post.text && (
                    <Text style={{ marginBottom: 8 }}>
                      {post.text.slice(0, 150)}...
                    </Text>
                  )}
                  {post.image && !post.video && (
                    <Image
                      src={post.image}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        marginBottom: 8,
                      }}
                    />
                  )}
                  <div style={{ display: "flex", gap: 16 }}>
                    <Text style={{ fontSize: 12 }}>❤️ {post.likes || 0}</Text>
                    <Text style={{ fontSize: 12 }}>
                      💬 {post.comments || 0}
                    </Text>
                  </div>
                </Div>
              </Card>
            ))}
          </Group>
        )}
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
