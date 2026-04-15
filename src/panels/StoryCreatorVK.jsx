import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Panel,
  PanelHeader,
  Group,
  Div,
  Text,
  Button,
  Textarea,
  Image,
  Alert,
} from "@vkontakte/vkui";
import vkBridge from "@vkontakte/vk-bridge";
import { saveStory, savePost } from "../services/api";
import { getCurrentUser } from "../components/StoriesBar";
import { STORY_COLORS, FONT_SIZES, STICKERS } from "../constants/app";
import "../styles/vkStories.css";

const currentUser = getCurrentUser();

export default function StoryCreatorVK({
  nav,
  onBack,
  onPublish,
  onPublishToFeed,
  existingStory,
  addToExisting,
}) {
  const [image, setImage] = useState(existingStory?.image || null);
  const [video, setVideo] = useState(existingStory?.video || null);
  const [text, setText] = useState(existingStory?.text || "");
  const [textColor, setTextColor] = useState(
    existingStory?.textColor || "#ffffff",
  );
  const [fontSize, setFontSize] = useState(existingStory?.fontSize || 24);
  const [stickers, setStickers] = useState(existingStory?.stickers || []);
  const [activeTool, setActiveTool] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasCtxRef = useRef(null);
  const lastPointRef = useRef(null);

  useEffect(() => {
    if (existingStory) {
      setImage(existingStory.image || null);
      setVideo(existingStory.video || null);
      setText(existingStory.text || "");
      setTextColor(existingStory.textColor || "#ffffff");
      setFontSize(existingStory.fontSize || 24);
      setStickers(existingStory.stickers || []);
    }
  }, [existingStory]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasCtxRef.current = canvas.getContext("2d");
    canvasCtxRef.current.strokeStyle = textColor;
    canvasCtxRef.current.lineWidth = 3;
    canvasCtxRef.current.lineCap = "round";
  }, [textColor]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (file.type.startsWith("image/")) setImage(ev.target.result);
      else if (file.type.startsWith("video/")) setVideo(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleRemoveMedia = () => {
    setImage(null);
    setVideo(null);
    setStickers([]);
  };

  const handleCanvasTouchStart = (e) => {
    if (activeTool !== "draw") return;
    const touch = e.touches[0];
    lastPointRef.current = { x: touch.clientX, y: touch.clientY };
    setDrawing(true);
  };

  const handleCanvasTouchMove = (e) => {
    if (!drawing || activeTool !== "draw" || !canvasCtxRef.current) return;
    const touch = e.touches[0];
    const ctx = canvasCtxRef.current;
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(touch.clientX, touch.clientY);
    ctx.stroke();
    lastPointRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleCanvasTouchEnd = () => {
    setDrawing(false);
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    if (!canvasCtxRef.current || !canvasRef.current) return;
    canvasCtxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
  };

  const addSticker = (emoji) => {
    setStickers([
      ...stickers,
      {
        id: Date.now(),
        emoji,
        x: window.innerWidth / 2 - 24,
        y: window.innerHeight / 2 - 24,
      },
    ]);
    setShowStickerPicker(false);
  };

  const removeSticker = (id) => {
    setStickers(stickers.filter((s) => s.id !== id));
  };

  const handleStickerDrag = (id, e) => {
    const touch = e.touches[0];
    setStickers(
      stickers.map((s) =>
        s.id === id
          ? { ...s, x: touch.clientX - 24, y: touch.clientY - 24 }
          : s,
      ),
    );
  };

  const handlePublish = async () => {
    if (!image && !video && !text.trim() && stickers.length === 0) {
      setAlertMessage("Добавьте фото, видео или текст");
      setShowAlert(true);
      return;
    }
    setPublishing(true);
    try {
      const story = {
        id: existingStory?.id || Date.now(),
        image,
        video,
        text,
        textColor,
        fontSize,
        stickers,
        timestamp: Date.now(),
        views: 0,
        type: video ? "video" : "photo",
        authorName: currentUser.firstName || "Вы",
        authorId: currentUser.id,
      };

      // saveStory() уже сохраняет в localStorage + синхронизирует с API в фоне
      // Не сохраняем дважды!
      saveStory(story).catch((err) =>
        console.error("Failed to sync story to API:", err),
      );

      onPublish(story);
      onBack();
    } catch (err) {
      setAlertMessage("Ошибка: " + err.message);
      setShowAlert(true);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToFeed = async () => {
    if (!image && !video && !text.trim()) {
      setAlertMessage("Нечего публиковать");
      setShowAlert(true);
      return;
    }
    setPublishing(true);
    try {
      const post = {
        id: Date.now(),
        author: "Вы",
        avatar: "",
        date: new Date().toISOString().split("T")[0],
        text: text || "Моя история",
        image,
        video,
        type: video ? "video" : "photo",
        likes: 0,
        comments: 0,
        reposts: 0,
        userId: currentUser.id,
      };

      const saved = await savePost(post);

      const posts = JSON.parse(
        localStorage.getItem("travelDiaryFeedPosts") || "[]",
      );
      posts.unshift(saved || post);
      localStorage.setItem("travelDiaryFeedPosts", JSON.stringify(posts));

      if (onPublishToFeed) onPublishToFeed(saved || post);
      onBack();
    } catch (err) {
      setAlertMessage("Ошибка: " + err.message);
      setShowAlert(true);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = () => {
    if (!existingStory) return;
    const saved = JSON.parse(
      localStorage.getItem("travelDiaryStories") || "[]",
    );
    localStorage.setItem(
      "travelDiaryStories",
      JSON.stringify(saved.filter((s) => s.id !== existingStory.id)),
    );
    onBack();
  };

  const hasMedia = !!(image || video);

  return (
    <Panel nav={nav} style={{ background: "#000", padding: 0 }}>
      <PanelHeader
        transparent
        delimiter="none"
        before={
          <Button
            mode="tertiary"
            onClick={onBack}
            style={{
              color: "#fff",
              minWidth: "auto",
              padding: "0 8px",
              background: "rgba(0,0,0,0.4)",
              borderRadius: "50%",
              width: 36,
              height: 36,
            }}
          >
            ✕
          </Button>
        }
        after={
          <div style={{ display: "flex", gap: 8 }}>
            {existingStory && !addToExisting && (
              <Button
                mode="tertiary"
                size="m"
                onClick={handleDelete}
                style={{
                  color: "#ff4444",
                  background: "rgba(0,0,0,0.4)",
                  borderRadius: 16,
                }}
              >
                🗑️
              </Button>
            )}
          </div>
        }
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
          padding: "8px 12px",
        }}
      />

      <div
        style={{
          width: "100%",
          height: "calc(100vh - 56px)",
          position: "relative",
          overflow: "hidden",
          background: "#000",
        }}
      >
        {image && !video && (
          <>
            <Image
              src={image}
              alt="Story"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <button
              onClick={handleRemoveMedia}
              style={{
                position: "absolute",
                top: 60,
                right: 12,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 5,
                color: "#fff",
              }}
            >
              ✕
            </button>
          </>
        )}

        {video && (
          <>
            <video
              src={video}
              muted
              playsInline
              autoPlay
              loop
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <button
              onClick={handleRemoveMedia}
              style={{
                position: "absolute",
                top: 60,
                right: 12,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 5,
                color: "#fff",
              }}
            >
              ✕
            </button>
          </>
        )}

        {!image && !video && (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <button
              onClick={() => photoInputRef.current?.click()}
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                border: "2px solid rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </button>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                textAlign: "center",
                padding: "0 40px",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {addToExisting ? "Добавить в историю" : "Создайте историю"}
              </div>
              <div style={{ fontSize: 14 }}>
                {addToExisting
                  ? "Добавьте новое фото или видео"
                  : "Выберите фото или видео"}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="photo-input"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="video-input"
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => photoInputRef.current?.click()}
                style={{
                  padding: "12px 24px",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 20,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📷 Фото
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                style={{
                  padding: "12px 24px",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 20,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                🎬 Видео
              </button>
            </div>
          </div>
        )}

        {hasMedia && activeTool === "draw" && (
          <canvas
            ref={canvasRef}
            className="vk-story-drawing-canvas"
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          />
        )}

        {hasMedia && activeTool === "text" && (
          <div className="vk-story-text-editor">
            <textarea
              className="vk-story-text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст..."
              rows={3}
              style={{ color: textColor, fontSize }}
            />
          </div>
        )}

        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            className="vk-story-sticker-draggable"
            style={{ left: sticker.x, top: sticker.y }}
            onTouchMove={(e) => handleStickerDrag(sticker.id, e)}
            onClick={() => removeSticker(sticker.id)}
          >
            {sticker.emoji}
          </div>
        ))}

        {hasMedia && (
          <div className="vk-story-toolbar">
            <button
              className={`vk-story-tool-btn ${activeTool === "text" ? "active" : ""}`}
              onClick={() => {
                setActiveTool(activeTool === "text" ? null : "text");
                setShowColorPicker(false);
                setShowFontSize(false);
                setShowStickerPicker(false);
              }}
            >
              Aa
            </button>
            <button
              className={`vk-story-tool-btn ${activeTool === "draw" ? "active" : ""}`}
              onClick={() => {
                setActiveTool(activeTool === "draw" ? null : "draw");
                setShowColorPicker(false);
                setShowFontSize(false);
                setShowStickerPicker(false);
              }}
            >
              ✏️
            </button>
            <button
              className={`vk-story-tool-btn ${activeTool === "sticker" ? "active" : ""}`}
              onClick={() => {
                setActiveTool(activeTool === "sticker" ? null : "sticker");
                setShowStickerPicker(!showStickerPicker);
                setShowColorPicker(false);
                setShowFontSize(false);
              }}
            >
              😀
            </button>
            {activeTool === "draw" && (
              <button className="vk-story-tool-btn" onClick={clearCanvas}>
                🗑️
              </button>
            )}
          </div>
        )}

        {(activeTool === "text" || activeTool === "draw") &&
          showColorPicker && (
            <div className="vk-story-color-picker">
              {STORY_COLORS.map((color) => (
                <div
                  key={color}
                  className={`vk-story-color-option ${textColor === color ? "selected" : ""}`}
                  style={{ background: color }}
                  onClick={() => setTextColor(color)}
                />
              ))}
            </div>
          )}

        {activeTool === "text" && showFontSize && (
          <div className="vk-story-font-sizes">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                className={`vk-story-font-size-btn ${fontSize === size ? "selected" : ""}`}
                style={{ fontSize: size - 4 }}
                onClick={() => setFontSize(size)}
              >
                A
              </button>
            ))}
          </div>
        )}

        {showStickerPicker && (
          <div className="vk-story-sticker-picker">
            {STICKERS.map((sticker) => (
              <div
                key={sticker}
                className="vk-story-sticker"
                onClick={() => addSticker(sticker)}
              >
                {sticker}
              </div>
            ))}
          </div>
        )}

        {hasMedia && activeTool === "text" && (
          <div
            style={{
              position: "absolute",
              bottom: "160px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 8,
            }}
          >
            <button
              className="vk-story-tool-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              🎨
            </button>
            <button
              className="vk-story-tool-btn"
              onClick={() => setShowFontSize(!showFontSize)}
            >
              📏
            </button>
          </div>
        )}

        {hasMedia && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(0,0,0,0.85)",
              padding: "16px",
              paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              display: "flex",
              gap: 12,
              zIndex: 20,
            }}
          >
            <Button
              mode="outline"
              size="l"
              onClick={handlePublishToFeed}
              disabled={publishing}
              style={{
                flex: 1,
                color: "#fff",
                borderColor: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.1)",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              📌 В ленту
            </Button>
            <Button
              mode="primary"
              size="l"
              onClick={handlePublish}
              disabled={
                publishing ||
                (!image && !video && !text.trim() && stickers.length === 0)
              }
              style={{
                flex: 2,
                background: "#2688eb",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              {publishing
                ? "..."
                : existingStory && !addToExisting
                  ? "💾 Сохранить"
                  : "📤 Опубликовать"}
            </Button>
          </div>
        )}
      </div>

      {showAlert && (
        <Alert
          header="Ошибка"
          text={alertMessage}
          onClose={() => setShowAlert(false)}
        />
      )}
    </Panel>
  );
}
