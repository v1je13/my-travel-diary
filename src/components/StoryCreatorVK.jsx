import React, { useState, useRef, useCallback, useEffect } from "react";
import { Panel, PanelHeader, Button } from "@vkontakte/vkui";
import vkBridge from "@vkontakte/vk-bridge";
import "../styles/vkStories.css";

const COLORS = [
  "#ffffff",
  "#ff3b30",
  "#ff9500",
  "#ffcc00",
  "#4cd964",
  "#007aff",
  "#5856d6",
  "#ff2d55",
  "#000000",
];

const FONT_SIZES = [16, 20, 24, 32, 40, 48];

const STICKERS = [
  "😀",
  "😍",
  "🥳",
  "😎",
  "🤩",
  "😱",
  "🔥",
  "❤️",
  "💯",
  "👍",
  "🙌",
  "🎉",
  "✨",
  "🌟",
  "🎊",
  "🎈",
  "📍",
  "✈️",
  "🌍",
  "🏖️",
  "🗺️",
  "📸",
  "🎬",
  "🎵",
];

export default function StoryCreatorVK({
  nav,
  onBack,
  onPublish,
  onPublishToFeed,
  existingStory,
}) {
  const [image, setImage] = useState(existingStory?.image || null);
  const [video, setVideo] = useState(existingStory?.video || null);
  const [text, setText] = useState(existingStory?.text || "");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(24);
  const [stickers, setStickers] = useState(existingStory?.stickers || []);
  const [activeTool, setActiveTool] = useState(null); // 'text', 'draw', 'sticker'
  const [drawing, setDrawing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasCtxRef = useRef(null);
  const lastPointRef = useRef(null);

  // Open gallery via VK Bridge
  const openGallery = useCallback(async () => {
    try {
      // Try VK Bridge first
      const result = await vkBridge.send("VKWebAppShowImages", {
        type: "photo",
      });
      if (result?.images?.length > 0) {
        setImage(result.images[0]);
      }
    } catch (e) {
      console.log("VK Bridge failed, using file input:", e);
      // Fallback to file input
      fileInputRef.current?.click();
    }
  }, []);

  // Open camera for photo
  const openCamera = useCallback(async () => {
    try {
      const result = await vkBridge.send("VKWebAppGetCommunityToken", {
        app_id: 0,
        scope: "photos",
      });
      // Use file input as fallback
      fileInputRef.current?.click();
    } catch (e) {
      console.log("Camera not available, using file input:", e);
      fileInputRef.current?.click();
    }
  }, []);

  // Open camera for video recording
  const openVideoCamera = useCallback(async () => {
    try {
      // Try to access device camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => {
          setVideo(ev.target.result);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();

      // Show recording UI (simplified - in production you'd add stop button)
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 60000); // Auto-stop after 60 seconds
    } catch (e) {
      console.log("Video recording not available, using file input:", e);
      fileInputRef.current?.click();
    }
  }, []);

  // File input fallback
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

  // Canvas drawing
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasCtxRef.current = canvas.getContext("2d");
    canvasCtxRef.current.strokeStyle = textColor;
    canvasCtxRef.current.lineWidth = 3;
    canvasCtxRef.current.lineCap = "round";
  }, []);

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
    const ctx = canvasCtxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Add sticker
  const addSticker = (emoji) => {
    const newSticker = {
      id: Date.now(),
      emoji,
      x: window.innerWidth / 2 - 24,
      y: window.innerHeight / 2 - 24,
    };
    setStickers([...stickers, newSticker]);
    setShowStickerPicker(false);
  };

  // Remove sticker
  const removeSticker = (id) => {
    setStickers(stickers.filter((s) => s.id !== id));
  };

  // Drag sticker
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
        isMine: true,
        type: video ? "video" : "photo",
        authorName: "Вы",
        authorId: "mine",
      };

      const saved = JSON.parse(
        localStorage.getItem("travelDiaryStories") || "[]",
      );
      if (existingStory) {
        const idx = saved.findIndex((s) => s.id === existingStory.id);
        if (idx !== -1) saved[idx] = story;
      } else {
        saved.push(story);
      }
      localStorage.setItem("travelDiaryStories", JSON.stringify(saved));
      onPublish(story);
      onBack();
    } catch (err) {
      console.error("Error publishing story:", err);
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishToFeed = async () => {
    if (!image && !video && !text.trim()) return;
    setPublishing(true);
    try {
      const post = {
        id: Date.now(),
        author: "Вы",
        avatar: "https://vk.com/images/camera_100.png",
        date: "только что",
        text: text || "Моя история",
        image,
        video,
        type: video ? "video" : "photo",
        likes: 0,
        comments: 0,
        reposts: 0,
      };
      const posts = JSON.parse(
        localStorage.getItem("travelDiaryFeedPosts") || "[]",
      );
      posts.unshift(post);
      localStorage.setItem("travelDiaryFeedPosts", JSON.stringify(posts));
      if (onPublishToFeed) onPublishToFeed(post);
      onBack();
    } catch (err) {
      console.error("Error publishing to feed:", err);
    } finally {
      setPublishing(false);
    }
  };

  const hasMedia = !!(image || video);

  return (
    <Panel nav={nav} style={{ background: "#000", padding: 0 }}>
      {/* Header */}
      <PanelHeader
        transparent
        delimiter="none"
        before={
          <Button
            mode="tertiary"
            onClick={onBack}
            style={{ color: "#fff", minWidth: "auto", padding: "0 8px" }}
          >
            ✕
          </Button>
        }
        after={
          <div style={{ display: "flex", gap: 8 }}>
            {hasMedia && (
              <Button
                mode="tertiary"
                size="m"
                onClick={handlePublishToFeed}
                disabled={publishing}
                style={{ color: "#fff" }}
              >
                В ленту
              </Button>
            )}
            <Button
              mode="primary"
              size="m"
              onClick={handlePublish}
              disabled={
                publishing ||
                (!image && !video && !text.trim() && stickers.length === 0)
              }
            >
              {publishing ? "..." : "Опубликовать"}
            </Button>
          </div>
        }
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: "transparent",
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
        {/* Media or placeholder */}
        {image && !video && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <img
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
          </div>
        )}

        {video && (
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
          </div>
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
              onClick={openGallery}
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
                Создайте историю
              </div>
              <div style={{ fontSize: 14 }}>
                Выберите фото или видео из галереи
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
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="photo-input"
            />
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="video-input"
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => {
                  // Try to trigger file input directly
                  const photoInput = document.getElementById("photo-input");
                  if (photoInput) {
                    photoInput.click();
                  } else {
                    openGallery();
                  }
                }}
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
                onClick={() => {
                  const videoInput = document.getElementById("video-input");
                  if (videoInput) {
                    videoInput.click();
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
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

        {/* Drawing canvas */}
        {hasMedia && activeTool === "draw" && (
          <canvas
            ref={canvasRef}
            className="vk-story-drawing-canvas"
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
          />
        )}

        {/* Text editor */}
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

        {/* Stickers */}
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

        {/* Toolbar */}
        {hasMedia && (
          <div className="vk-story-toolbar">
            <button
              className={`vk-story-tool-btn ${
                activeTool === "text" ? "active" : ""
              }`}
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
              className={`vk-story-tool-btn ${
                activeTool === "draw" ? "active" : ""
              }`}
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
              className={`vk-story-tool-btn ${
                activeTool === "sticker" ? "active" : ""
              }`}
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

        {/* Color picker */}
        {(activeTool === "text" || activeTool === "draw") &&
          showColorPicker && (
            <div className="vk-story-color-picker">
              {COLORS.map((color) => (
                <div
                  key={color}
                  className={`vk-story-color-option ${
                    textColor === color ? "selected" : ""
                  }`}
                  style={{ background: color }}
                  onClick={() => setTextColor(color)}
                />
              ))}
            </div>
          )}

        {/* Font size selector */}
        {activeTool === "text" && showFontSize && (
          <div className="vk-story-font-sizes">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                className={`vk-story-font-size-btn ${
                  fontSize === size ? "selected" : ""
                }`}
                style={{ fontSize: size - 4 }}
                onClick={() => setFontSize(size)}
              >
                A
              </button>
            ))}
          </div>
        )}

        {/* Sticker picker */}
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

        {/* Text controls toggle */}
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
      </div>
    </Panel>
  );
}
