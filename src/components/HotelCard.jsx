import React from "react";
import { Card, Text, Title, Avatar, Button } from "@vkontakte/vkui";

export default function HotelCard({ hotel, onClick }) {
  const {
    name = "Отель",
    city = "Город",
    country = "Страна",
    image,
    rating = 4.5,
    price = "от 5000 ₽",
    description = "Описание отеля"
  } = hotel || {};

  return (
    <Card mode="shadow" style={{ marginBottom: 12, cursor: "pointer" }} onClick={onClick}>
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <Avatar size={48} src={image || "https://vk.com/images/camera_100.png"} />
          <div style={{ marginLeft: 12, flex: 1 }}>
            <Title level="3" style={{ marginBottom: 4 }}>
              {name}
            </Title>
            <Text style={{ color: "var(--vkui--color_text_secondary)" }}>
              📍 {city}, {country}
            </Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span>⭐</span>
            <Text>{rating}</Text>
          </div>
        </div>

        <Text style={{ marginBottom: 12, color: "var(--vkui--color_text_secondary)" }}>
          {description.length > 100 ? `${description.slice(0, 100)}...` : description}
        </Text>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "bold", color: "var(--vkui--color_text_accent)" }}>
            {price}
          </Text>
          <Button size="m" mode="tertiary">
            Подробнее
          </Button>
        </div>
      </div>
    </Card>
  );
}