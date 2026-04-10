import React, { useState, useEffect } from "react";
import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Group,
  Div,
  Title,
  Text,
  Avatar,
  Separator,
  FormItem,
  Textarea,
  Button,
  Image,
  HorizontalScroll,
  ModalRoot,
  ModalPage,
  ModalPageHeader,
} from "@vkontakte/vkui";
import {
  Icon24ArrowLeftOutline,
  Icon24Like,
  Icon24Comment,
  Icon24Share,
  Icon24Send,
} from "@vkontakte/icons";
import { likePost, addComment, getPostComments } from "../api";
import { getCurrentUser } from "../components/StoriesBar";
import vkBridge from "@vkontakte/vk-bridge";

export default function PostDetail({ nav, post, onBack }) {
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Check if user already liked this post - moved to useState initializer
  const [liked, setLiked] = useState(() => {
    try {
      const likedPosts = JSON.parse(
        localStorage.getItem("travelDiaryLikedPosts") || "[]",
      );
      return likedPosts.includes(post?.id);
    } catch {
      return false;
    }
  });

  // Load comments on mount
  useEffect(() => {
    if (post?.id) loadComments();
  }, [post?.id]);

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const loaded = await getPostComments(post.id);
      setComments(loaded || []);
    } catch (e) {
      console.error("Failed to load comments:", e);
      setComments([]);
    }
    setCommentsLoading(false);
  };

  if (!post) {
    return (
      <Panel nav={nav}>
        <PanelHeader>Пост не найден</PanelHeader>
        <Group>
          <Div>
            <Button onClick={onBack}>Вернуться в ленту</Button>
          </Div>
        </Group>
      </Panel>
    );
  }

  const handleLike = async () => {
    const user = getCurrentUser();
    const willLike = !liked;
    const likedPosts = JSON.parse(
      localStorage.getItem("travelDiaryLikedPosts") || "[]",
    );

    try {
      const result = await likePost(post.id, user.id);
      if (result) {
        setLikesCount(result.likes || 0);
        setLiked(result.liked);
      }
    } catch (e) {
      console.error("Like failed:", e);
    }

    // Persist liked state
    if (willLike) {
      if (!likedPosts.includes(post.id)) {
        likedPosts.push(post.id);
      }
    } else {
      const idx = likedPosts.indexOf(post.id);
      if (idx >= 0) likedPosts.splice(idx, 1);
    }
    localStorage.setItem("travelDiaryLikedPosts", JSON.stringify(likedPosts));
    setLiked(willLike);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const user = getCurrentUser();
    const commentObj = {
      postId: post.id,
      author: user.displayName,
      avatar: "",
      text: newComment.trim(),
      date: new Date().toLocaleString("ru-RU"),
      userId: user.id,
    };
    try {
      const saved = await addComment(commentObj);
      if (saved) {
        setComments([saved, ...comments]);
        setNewComment("");
      }
    } catch (e) {
      console.error("Comment failed:", e);
      // Fallback: save locally
      const localComment = { ...commentObj, id: Date.now() };
      const localAll = JSON.parse(
        localStorage.getItem("travelDiaryComments") || "[]",
      );
      localAll.unshift(localComment);
      localStorage.setItem("travelDiaryComments", JSON.stringify(localAll));
      setComments([localComment, ...comments]);
      setNewComment("");
    }
  };

  const handleShare = async () => {
    const user = getCurrentUser();
    // Use current user's name if post author is generic ("Вы")
    const authorName =
      post.author && !post.author.includes("Вы")
        ? post.author
        : user.displayName;
    try {
      await vkBridge.send("VKWebAppShare", {
        text: `Посмотри пост от ${authorName}:\n\n${post.text?.slice(0, 300) || "Интересный пост!"}`,
      });
    } catch (e) {
      console.warn("VK Share failed:", e);
      try {
        await navigator.clipboard?.writeText(
          `Посмотри пост от ${authorName}:\n\n${post.text?.slice(0, 300) || "Интересный пост!"}`,
        );
        alert("Текст скопирован!");
      } catch (e2) {}
    }
    setShowShareModal(false);
  };

  return (
    <Panel nav={nav} style={{ background: "#f5f0e8" }}>
      {/* Header */}
      <PanelHeader
        before={
          <PanelHeaderButton onClick={onBack}>
            <Icon24ArrowLeftOutline />
          </PanelHeaderButton>
        }
      >
        {post.hotel?.name || post.location || "Пост"}
      </PanelHeader>

      {/* Author */}
      <Div>
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <Avatar size={48} src={post.avatar} mode="circle" />
          <div style={{ marginLeft: 12 }}>
            <Title level="3" style={{ fontSize: 16 }}>
              {post.author || "Пользователь"}
            </Title>
          </div>
        </div>
      </Div>

      {/* Title */}
      {post.title && (
        <Div style={{ padding: "0 0 8px 0" }}>
          <Title level="1" style={{ fontSize: 22, fontWeight: 700 }}>
            {post.title}
          </Title>
        </Div>
      )}

      {/* Main Image */}
      {post.image && (
        <Div style={{ padding: "0 0 16px 0" }}>
          <Image
            src={post.image}
            alt={post.text || "Пост"}
            style={{
              width: "100%",
              borderRadius: 16,
              maxHeight: 400,
              objectFit: "cover",
            }}
          />
        </Div>
      )}

      {/* Video */}
      {post.video && (
        <Div style={{ padding: "0 0 16px 0" }}>
          <video
            src={post.video}
            style={{
              width: "100%",
              borderRadius: 16,
              maxHeight: 400,
              objectFit: "cover",
            }}
            controls
            playsInline
          />
        </Div>
      )}

      {/* Description */}
      <Group>
        <Div>
          <Title level="2" style={{ fontSize: 18, marginBottom: 8 }}>
            Описание
          </Title>
          <Text style={{ lineHeight: 1.6, fontSize: 15 }}>
            {post.text || ""}
          </Text>
        </Div>
      </Group>

      <Separator />

      {/* Action Bar */}
      <Div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
          }}
        >
          {/* Like */}
          <Button
            mode="tertiary"
            before={<Icon24Like />}
            onClick={handleLike}
            style={{
              color: liked ? "var(--vkui--color_icon_accent)" : "inherit",
            }}
          >
            {likesCount}
          </Button>

          {/* Comment */}
          <Button
            mode="tertiary"
            before={<Icon24Comment />}
            onClick={() => document.getElementById("comment-input")?.focus()}
          >
            {(post.comments || 0) + comments.length}
          </Button>

          {/* Share */}
          <Button
            mode="tertiary"
            before={<Icon24Share />}
            onClick={() => setShowShareModal(true)}
          >
            Поделиться
          </Button>
        </div>
      </Div>

      <Separator />

      {/* Comments Section */}
      <Group
        header={
          <Title level="2" style={{ fontSize: 16 }}>
            Комментарии
          </Title>
        }
      >
        {/* Comment Input */}
        <Div>
          <div style={{ display: "flex", gap: 8 }}>
            <Avatar size={36} src={post.avatar} mode="circle" />
            <div style={{ flex: 1 }}>
              <Textarea
                id="comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                rows={2}
              />
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  size="m"
                  mode="primary"
                  before={<Icon24Send />}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Отправить
                </Button>
              </div>
            </div>
          </div>
        </Div>

        <Separator />

        {/* Comments List */}
        <Div>
          {commentsLoading ? (
            <Text
              style={{
                color: "var(--vkui--color_text_secondary)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              Загрузка...
            </Text>
          ) : comments.length === 0 ? (
            <Text
              style={{
                color: "var(--vkui--color_text_secondary)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              Комментировать
            </Text>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{ display: "flex", gap: 12, marginBottom: 16 }}
              >
                <Avatar size={36} src={comment.avatar} mode="circle" />
                <div style={{ flex: 1 }}>
                  <Title level="3" style={{ fontSize: 14 }}>
                    {comment.author}
                  </Title>
                  <Text style={{ fontSize: 14, marginTop: 4 }}>
                    {comment.text}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "var(--vkui--color_text_secondary)",
                      marginTop: 4,
                    }}
                  >
                    {comment.date}
                  </Text>
                </div>
              </div>
            ))
          )}
        </Div>
      </Group>

      {/* Share Modal */}
      <ModalRoot activeModal={showShareModal ? "share" : null}>
        <ModalPage
          id="share"
          header={<ModalPageHeader>Поделиться</ModalPageHeader>}
        >
          <Group>
            <Div>
              <FormItem>
                <Button
                  stretched
                  size="l"
                  mode="primary"
                  before={<Icon24Send />}
                  onClick={handleShare}
                >
                  Отправить через VK
                </Button>
              </FormItem>
              <FormItem>
                <Button
                  stretched
                  size="l"
                  mode="secondary"
                  onClick={() => {
                    const user = getCurrentUser();
                    const authorName =
                      post.author && !post.author.includes("Вы")
                        ? post.author
                        : user.displayName;
                    navigator.clipboard?.writeText(
                      `${authorName}: ${post.text?.slice(0, 100)}...`,
                    );
                    setShowShareModal(false);
                  }}
                >
                  Скопировать текст
                </Button>
              </FormItem>
              <FormItem>
                <Button
                  stretched
                  size="l"
                  mode="tertiary"
                  onClick={() => setShowShareModal(false)}
                >
                  Отмена
                </Button>
              </FormItem>
            </Div>
          </Group>
        </ModalPage>
      </ModalRoot>
    </Panel>
  );
}
