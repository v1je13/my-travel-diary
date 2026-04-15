import React, { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  ModalRoot,
  ModalPage,
  ModalPageHeader,
  Group,
  Div,
  FormItem,
  Textarea,
  Button,
  Image,
  Separator,
  HorizontalScroll,
  Input,
} from "@vkontakte/vkui";
import { Icon24Camera, Icon24Video } from "@vkontakte/icons";
import { savePost } from "../services/api";
import { getCurrentUser } from "./StoriesBar";

const currentUser = getCurrentUser();

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export default function CreatePostModal({ visible, onClose, onPublished }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]); // { type: 'photo'|'video', data: base64 }
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleFileSelect = async (e, type) => {
    const files = Array.from(e.target.files);
    setUploading(true);

    const newMedia = [];
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        newMedia.push({ type, data: base64 });
      } catch (err) {
        console.error("Failed to read file:", err);
      }
    }

    setMediaFiles((prev) => [...prev, ...newMedia]);
    setUploading(false);
    e.target.value = "";
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!text.trim() && mediaFiles.length === 0) return;

    const post = {
      title: title.trim() || null,
      author: currentUser.displayName,
      avatar: "",
      text: text,
      image: mediaFiles.find((m) => m.type === "photo")?.data || "",
      video: mediaFiles.find((m) => m.type === "video")?.data || "",
      type: mediaFiles.find((m) => m.type === "video")
        ? "video"
        : mediaFiles.length > 0
          ? "photo"
          : "text",
      likes: 0,
      comments: 0,
      reposts: 0,
      date: new Date().toISOString().split("T")[0],
    };

    const saved = await savePost(post);
    if (saved) {
      onPublished?.(saved);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setText("");
    setMediaFiles([]);
    onClose();
  };

  const handleClose = () => {
    resetForm();
  };

  return (
    <ModalRoot activeModal={visible ? "createPost" : null}>
      <ModalPage
        id="createPost"
        header={<ModalPageHeader>Новая запись</ModalPageHeader>}
        onClose={handleClose}
      >
        <Group>
          {/* Title */}
          <Div>
            <FormItem top="Заголовок (необязательно)">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название поста..."
              />
            </FormItem>
          </Div>

          {/* Text */}
          <Div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Расскажите о своём путешествии..."
              rows={5}
            />
          </Div>

          <Separator />

          {/* Media Preview */}
          {mediaFiles.length > 0 && (
            <Div>
              <HorizontalScroll>
                <div style={{ display: "flex", gap: 8 }}>
                  {mediaFiles.map((media, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "relative",
                        width: 120,
                        height: 120,
                        flexShrink: 0,
                      }}
                    >
                      {media.type === "photo" ? (
                        <Image
                          src={media.data}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 12,
                          }}
                        />
                      ) : (
                        <video
                          src={media.data}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 12,
                          }}
                        />
                      )}
                      <button
                        onClick={() => removeMedia(idx)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </HorizontalScroll>
            </Div>
          )}

          <Separator />

          {/* Attach buttons */}
          <Div>
            <div style={{ display: "flex", gap: 12 }}>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, "photo")}
              />
              <Button
                mode="secondary"
                before={<Icon24Camera />}
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
              >
                Фото
              </Button>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, "video")}
              />
              <Button
                mode="secondary"
                before={<Icon24Video />}
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading}
              >
                Видео
              </Button>
            </div>
          </Div>

          <Separator />

          {/* Actions */}
          <Div>
            <Button
              stretched
              size="l"
              mode="primary"
              onClick={handlePublish}
              disabled={uploading || (!text.trim() && mediaFiles.length === 0)}
            >
              {uploading ? "Загрузка..." : "Опубликовать"}
            </Button>
            <Div style={{ marginTop: 8 }}>
              <Button stretched size="l" mode="tertiary" onClick={handleClose}>
                Отмена
              </Button>
            </Div>
          </Div>
        </Group>
      </ModalPage>
    </ModalRoot>
  );
}

CreatePostModal.propTypes = {
  id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};
