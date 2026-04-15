import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  Panel,
  PanelHeader,
  Search as VKUISearch,
  Group,
  Div,
  Title,
  Text,
  Card,
  Avatar,
  Placeholder,
  Spinner,
} from "@vkontakte/vkui";
import { searchPosts } from "../services/api";
import { APP_CONFIG } from "../constants/app";

export default function SearchPanel({ nav, onOpenPost }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      if (value && value.trim()) {
        setLoading(true);
        try {
          const results = await searchPosts(value);
          setPosts(results || []);
          setHasSearched(true);
        } catch (error) {
          console.error("Search failed:", error);
          setPosts([]);
        } finally {
          setLoading(false);
        }
      } else {
        setPosts([]);
        setHasSearched(false);
      }
    }, APP_CONFIG.DEBOUNCE_DELAY);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => clearTimeout(searchTimeoutRef.current);
  }, []);

  return (
    <Panel nav={nav}>
      <PanelHeader>Поиск</PanelHeader>
      <Div>
        <VKUISearch
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Поиск по постам..."
        />
      </Div>

      {loading ? (
        <Group>
          <Div style={{ textAlign: "center" }}>
            <Spinner size="large" />
          </Div>
        </Group>
      ) : hasSearched ? (
        posts.length === 0 ? (
          <Group>
            <Placeholder>Ничего не найдено</Placeholder>
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
                        {post.author || "Пользователь"}
                      </Title>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "var(--vkui--color_text_secondary)",
                        }}
                      >
                        {post.date || "только что"}
                      </Text>
                    </div>
                  </div>
                  <Text style={{ marginBottom: 12 }}>{post.text || ""}</Text>
                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      style={{
                        borderRadius: 8,
                        maxWidth: "100%",
                        marginBottom: 12,
                      }}
                    />
                  )}
                </Div>
              </Card>
            ))}
          </Group>
        )
      ) : (
        <Group>
          <Placeholder>Введите поисковый запрос</Placeholder>
        </Group>
      )}
    </Panel>
  );
}

SearchPanel.propTypes = {
  nav: PropTypes.string.isRequired,
  onOpenPost: PropTypes.func,
};
