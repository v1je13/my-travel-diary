import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import vkBridge from "@vkontakte/vk-bridge";
import {
  Panel,
  PanelHeader,
  Group,
  Div,
  Title,
  Text,
  Avatar,
  Placeholder,
  Button,
} from "@vkontakte/vkui";
import { getCurrentUser } from "../components/StoriesBar";

export default function Profile({ nav }) {
  const currentUser = getCurrentUser();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получаем информацию о пользователе
        const userInfoResponse = await vkBridge.send("VKWebAppGetUserInfo");
        setUserInfo(userInfoResponse);
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Panel nav={nav}>
        <Placeholder>
          <div>Загрузка...</div>
        </Placeholder>
      </Panel>
    );
  }

  const userName = userInfo
    ? `${userInfo.first_name || ""} ${userInfo.last_name || ""}`.trim()
    : currentUser?.displayName || currentUser?.firstName || "Пользователь";

  const userPhoto =
    userInfo?.photo_100 ||
    userInfo?.photo_max ||
    "https://vk.com/images/camera_100.png";

  return (
    <Panel nav={nav}>
      <PanelHeader>Профиль</PanelHeader>
      <Group>
        <Div style={{ textAlign: "center", padding: "24px 0" }}>
          <Avatar size={96} src={userPhoto} mode="circle" />
          <Title level="2" style={{ marginTop: 12 }}>
            {userName}
          </Title>
          <Text style={{ color: "var(--vkui--color_text_secondary)" }}>
            Добро пожаловать в Travel Diary!
          </Text>
        </Div>
      </Group>
    </Panel>
  );
}

Profile.propTypes = {
  nav: PropTypes.string.isRequired,
};
