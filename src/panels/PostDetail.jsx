import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import vkBridge from "@vkontakte/vk-bridge";
import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Group,
  Div,
  Title,
  Text,
  Button,
  SimpleCell,
  Header,
  Avatar,
  Card,
  Separator,
  Counter,
  Spacing,
  Footer,
  HorizontalScroll,
  FormItem,
  Textarea,
} from "@vkontakte/vkui";
import {
  Icon28LikeOutline,
  Icon28CommentOutline,
  Icon28ShareOutline,
  Icon28BookmarkOutline,
  Icon28MessageOutline,
} from "@vkontakte/icons";
import { likePost, addComment, getPostComments } from "../services/api";
import { STORAGE_KEYS } from "../constants/app";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { getCurrentUser } from "../components/StoriesBar";

export default function PostDetail({ nav, post, onBack }) {
  const currentUser = getCurrentUser();
  const [likedPosts, setLikedPosts] = useLocalStorage(
    STORAGE_KEYS.LIKED_POSTS,
    [],
  );
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (post?.id) {
      loadComments();
      setLiked(likedPosts.includes(post.id));
      setLikesCount(post.likes || 0);
    }
  }, [post?.id]);

  const loadComments = async () => {
    try {
      const commentsData = await getPostComments(post.id);
      setComments(commentsData || []);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const result = await likePost(post.id, currentUser.id);
      if (result) {
        setLikesCount(result.likes || 0);
        setLiked(result.liked);
      }
    } catch (e) {
      console.error("Like failed:", e);
    }

    if (!liked) {
      setLikedPosts((prev) => {
        if (!prev.includes(post.id)) {
          return [...prev, post.id];
        }
        return prev;
      });
    } else {
      setLikedPosts((prev) => prev.filter((id) => id !== post.id));
    }
    setLiked(!liked);
  };

  const handleAddComment = async () => {
    if (!commentText || !commentText.trim()) return;

    try {
      const comment = {
        postId: post.id,
        author: currentUser.displayName || currentUser.firstName || "Вы",
        authorId: currentUser.id,
        text: commentText,
        date: new Date().toISOString().split("T")[0],
      };

      const result = await addComment(comment);
      if (result) {
        setComments((prev) => [result, ...prev]);
        setCommentText("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!post) {
    return (
      <Panel nav={nav}>
        <PanelHeader
          before={<PanelHeaderButton onClick={onBack}>Назад</PanelHeaderButton>}
        >
          Пост не найден
        </PanelHeader>
        <Group>
          <Div>
            <Button onClick={onBack}>Вернуться в ленту</Button>
          </Div>
        </Group>
      </Panel>
    );
  }

  const getCategoryIcon = () => {
    switch (post.category) {
      case "hotels":
        return "🏨";
      case "mountains":
        return "🏔️";
      case "beaches":
        return "🏖️";
      default:
        return "✈️";
    }
  };

  const getCategoryTitle = () => {
    switch (post.category) {
      case "hotels":
        return "Отель";
      case "mountains":
        return "Горное путешествие";
      case "beaches":
        return "Пляжный отдых";
      default:
        return "Путешествие";
    }
  };

  return (
    <Panel nav={nav}>
      <PanelHeader
        before={
          <Button mode="tertiary" onClick={onBack}>
            ← Назад
          </Button>
        }
      >
        {getCategoryIcon()} {post.hotel?.name || post.location || "Пост"}
      </PanelHeader>

      {/* Автор и основной контент */}
      <Group>
        <Div>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
          >
            <Avatar
              size={56}
              src={post.avatar || "https://vk.com/images/camera_100.png"}
            />
            <div style={{ marginLeft: 12 }}>
              <Title level="2" style={{ fontSize: 18 }}>
                {post.author || "Пользователь"}
              </Title>
              <Text
                style={{
                  fontSize: 13,
                  color: "var(--vkui--color_text_secondary)",
                }}
              >
                {post.date || "только что"} • {getCategoryTitle()}
              </Text>
            </div>
          </div>

          <Title level="1" style={{ marginBottom: 12, fontSize: 20 }}>
            {post.hotel?.name || post.location || "Моё путешествие"}
          </Title>

          <Text style={{ lineHeight: 1.5, marginBottom: 16, fontSize: 16 }}>
            {post.text || ""}
          </Text>

          {/* Детальная информация в зависимости от категории */}
          {post.hotel && (
            <Card mode="outline" style={{ padding: 16, marginBottom: 16 }}>
              <Title level="3" style={{ marginBottom: 12 }}>
                📋 Информация об отеле
              </Title>
              <SimpleCell>
                🏨 Название: <strong>{post.hotel.name}</strong>
              </SimpleCell>
              <SimpleCell>
                📍 Город: <strong>{post.hotel.city}</strong>
              </SimpleCell>
              <SimpleCell>
                ⭐ Рейтинг: <strong>{post.hotel.rating} / 5</strong>
              </SimpleCell>
              <SimpleCell>
                💰 Цена: <strong>{post.hotel.price}</strong>
              </SimpleCell>
            </Card>
          )}

          {post.location && (
            <Card mode="outline" style={{ padding: 16, marginBottom: 16 }}>
              <Title level="3" style={{ marginBottom: 12 }}>
                📋 Информация о локации
              </Title>
              <SimpleCell>
                📍 Место: <strong>{post.location}</strong>
              </SimpleCell>
              {post.difficulty && (
                <SimpleCell>
                  🎯 Сложность:{" "}
                  <strong>
                    {post.difficulty === "легкий"
                      ? "🟢 Легкий"
                      : post.difficulty === "средний"
                        ? "🟡 Средний"
                        : "🔴 Сложный"}
                  </strong>
                </SimpleCell>
              )}
              {post.duration && (
                <SimpleCell>
                  ⏱️ Длительность: <strong>{post.duration}</strong>
                </SimpleCell>
              )}
            </Card>
          )}

          {/* Галерея изображений */}
          {post.images && post.images.length > 0 && (
            <>
              <Header mode="secondary">Фотографии</Header>
              <HorizontalScroll>
                <div style={{ display: "flex", gap: 8, padding: "8px 0" }}>
                  {post.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Фото ${idx + 1}`}
                      style={{
                        width: 200,
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 12,
                        cursor: "pointer",
                      }}
                      onClick={() => console.log("Открыть фото", idx)}
                    />
                  ))}
                </div>
              </HorizontalScroll>
            </>
          )}

          {/* Действия с постом */}
          <Separator style={{ margin: "16px 0" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginBottom: 16,
            }}
          >
            <Button
              mode={liked ? "primary" : "tertiary"}
              size="l"
              before={liked ? null : <Icon28LikeOutline />}
              onClick={handleLike}
            >
              {likesCount}
            </Button>
            <Button
              mode="tertiary"
              size="l"
              before={<Icon28CommentOutline />}
              onClick={() => document.getElementById("comment-input")?.focus()}
            >
              {post.comments || 0}
            </Button>
            <Button
              mode="tertiary"
              size="l"
              before={<Icon28ShareOutline />}
              onClick={() => onShare && onShare(post.id)}
            >
              {post.reposts || 0}
            </Button>
            <Button
              mode="tertiary"
              size="l"
              before={<Icon28BookmarkOutline />}
              onClick={() => console.log("Добавить в закладки")}
            >
              Сохранить
            </Button>
          </div>

          <Separator />
        </Div>
      </Group>

      {/* Комментарии */}
      <Group
        header={
          <Header mode="secondary">Комментарии ({comments.length})</Header>
        }
      >
        <Div>
          {/* Форма добавления комментария */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Avatar
              size={36}
              src={currentUser.avatar || "https://vk.com/images/camera_100.png"}
            />
            <div style={{ flex: 1 }}>
              <FormItem>
                <Textarea
                  id="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Напишите комментарий..."
                  rows={2}
                />
              </FormItem>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 8,
                }}
              >
                <Button
                  size="s"
                  mode="primary"
                  onClick={handleAddComment}
                  disabled={!commentText || !commentText.trim()}
                >
                  Отправить
                </Button>
              </div>
            </div>
          </div>

          {/* Список комментариев */}
          {comments.map((comment) => (
            <Card
              key={comment.id}
              mode="outline"
              style={{ marginBottom: 12, padding: 12 }}
            >
              <div style={{ display: "flex", gap: 12 }}>
                <Avatar size={40} src={comment.avatar} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Title level="3" style={{ fontSize: 14 }}>
                      {comment.author}
                    </Title>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "var(--vkui--color_text_secondary)",
                      }}
                    >
                      {comment.date}
                    </Text>
                  </div>
                  <Text style={{ fontSize: 14, marginBottom: 8 }}>
                    {comment.text}
                  </Text>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Button
                      mode="tertiary"
                      size="s"
                      before={<Icon28LikeOutline width={14} height={14} />}
                    >
                      {comment.likes}
                    </Button>
                    <Button
                      mode="tertiary"
                      size="s"
                      before={<Icon28MessageOutline width={14} height={14} />}
                    >
                      Ответить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Footer>Больше комментариев не найдено</Footer>
        </Div>
      </Group>
    </Panel>
  );
}

PostDetail.propTypes = {
  nav: PropTypes.string.isRequired,
  post: PropTypes.object,
  onBack: PropTypes.func.isRequired,
};
