import React, { useState, useRef, useCallback } from "react";
import {
  Panel,
  PanelHeader,
  Search as VKSearch,
  Group,
  Placeholder,
  Div,
  Card,
  Text,
  Title,
  Avatar,
} from "@vkontakte/vkui";
import { searchPosts } from "../api";
import Loader from "../components/Loader";

// Debounce функция для поиска
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export default function SearchPanel({ nav, onOpenPost }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (value) => {
      if (!value.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const isNumeric = /^\d+$/.test(value.trim());
      const found = await searchPosts(value, isNumeric ? value : null);
      setResults(found);
      setLoading(false);
    }, 300),
  ).current;

  const handleSearch = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);

      if (!value.trim()) {
        setResults([]);
        return;
      }

      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  return (
    <Panel nav={nav} style={{ background: "#f5f0e8" }}>
      <PanelHeader>Поиск</PanelHeader>
      <Group>
        <VKSearch
          value={query}
          onChange={handleSearch}
          placeholder="Введите ID поста или текст..."
        />
      </Group>

      {loading && <Loader />}

      {!loading && query && results.length === 0 && (
        <Placeholder header="Ничего не найдено">
          🔍 Попробуйте изменить запрос или проверьте ID
        </Placeholder>
      )}

      {!loading && !query && (
        <Placeholder header="Поиск постов">
          🔍 Введите ID поста для поиска или текст
        </Placeholder>
      )}

      {!loading && results.length > 0 && (
        <Group>
          <Div>
            <Text
              style={{
                marginBottom: 12,
                color: "var(--vkui--color_text_secondary)",
              }}
            >
              Найдено: {results.length}
            </Text>
            {results.map((post) => (
              <Card
                key={post.id}
                mode="shadow"
                style={{ marginBottom: 12, cursor: "pointer" }}
                onClick={() => onOpenPost?.(post)}
              >
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <Avatar size={48} src={post.avatar} />
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <Title level="3" style={{ marginBottom: 4 }}>
                        {post.author}
                      </Title>
                      <Text
                        style={{
                          color: "var(--vkui--color_text_secondary)",
                          fontSize: 12,
                        }}
                      >
                        #{post.id} • {post.date}
                      </Text>
                    </div>
                  </div>
                  {post.text && (
                    <Text style={{ marginBottom: 8, lineHeight: 1.4 }}>
                      {post.text.slice(0, 100)}...
                    </Text>
                  )}
                  {post.image && !post.video && (
                    <img
                      src={post.image}
                      alt=""
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        maxHeight: 200,
                        objectFit: "cover",
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
                </div>
              </Card>
            ))}
          </Div>
        </Group>
      )}
    </Panel>
  );
}
