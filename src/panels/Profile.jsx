import React, { useState, useEffect } from "react";
import {
  Panel,
  PanelHeader,
  Group,
  Avatar,
  Div,
  Title,
  Text,
  Header,
  SimpleCell,
  Counter,
  Placeholder,
  Button,
  Input,
} from "@vkontakte/vkui";
import { useVKUser } from "../hooks/useVKUser";
import { getCurrentUser, setCurrentUserNames } from "../components/StoriesBar";
import TravelCard from "../components/TravelCard";

export default function Profile({ nav, onOpenTravel }) {
  const { user, loading: userLoading, error } = useVKUser();
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const travels = [];
  const stats = { total: 0, countries: 0, days: 0 };

  useEffect(() => {
    const vkFirst = user?.first_name || user?.firstName;
    const vkLast = user?.last_name || user?.lastName;
    if (vkFirst) {
      setFirstName(vkFirst);
      setLastName(vkLast || "");
      setCurrentUserNames(vkFirst, vkLast || "");
    } else {
      const local = getCurrentUser();
      setFirstName(local.firstName);
      setLastName(local.lastName);
    }
  }, [user]);

  const handleSaveName = () => {
    if (firstName.trim() && lastName.trim()) {
      setCurrentUserNames(firstName.trim(), lastName.trim());
    }
    setEditingName(false);
  };

  if (userLoading) {
    return (
      <Panel nav={nav}>
        <PanelHeader>Профиль</PanelHeader>
        <Placeholder>Загрузка...</Placeholder>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel nav={nav}>
        <PanelHeader>Профиль</PanelHeader>
        <Group>
          <Placeholder
            header="Ошибка загрузки"
            action={
              <Button onClick={() => window.location.reload()}>Обновить</Button>
            }
          >
            Не удалось загрузить данные пользователя
          </Placeholder>
        </Group>
      </Panel>
    );
  }

  return (
    <Panel nav={nav} style={{ background: "#f5f0e8" }}>
      <PanelHeader>Профиль</PanelHeader>

      <Group>
        <Div>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
          >
            <Avatar size={80} src={user?.photo_200} />
            <div style={{ marginLeft: 16, flex: 1 }}>
              {editingName ? (
                <div>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Имя"
                    style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}
                  />
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Фамилия"
                    style={{ fontSize: 18, fontWeight: 600 }}
                  />
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    <Button size="s" mode="primary" onClick={handleSaveName}>
                      Сохранить
                    </Button>
                    <Button
                      size="s"
                      mode="secondary"
                      onClick={() => setEditingName(false)}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Title level="2">
                    {firstName} {lastName}
                  </Title>
                  <Button
                    size="s"
                    mode="tertiary"
                    onClick={() => setEditingName(true)}
                    style={{ padding: 0, marginTop: 4 }}
                  >
                    Изменить имя
                  </Button>
                </>
              )}
              <Text
                style={{
                  color: "var(--vkui--color_text_secondary)",
                  marginTop: 4,
                }}
              >
                ID: {user?.id}
              </Text>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginTop: 16,
              padding: "12px 0",
              background: "var(--vkui--color_background_secondary)",
              borderRadius: 12,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <Title level="3">{stats.total}</Title>
              <Text style={{ fontSize: 13 }}>Путешествий</Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Title level="3">{stats.countries}</Title>
              <Text style={{ fontSize: 13 }}>Стран</Text>
            </div>
            <div style={{ textAlign: "center" }}>
              <Title level="3">{stats.days}</Title>
              <Text style={{ fontSize: 13 }}>Дней</Text>
            </div>
          </div>
        </Div>
      </Group>

      <Group header={<Header mode="secondary">Действия</Header>}>
        <SimpleCell indicator={<Counter mode="prominent">0</Counter>}>
          📚 Избранные отели
        </SimpleCell>
        <SimpleCell indicator={<Counter mode="prominent">0</Counter>}>
          👍 Мои отзывы
        </SimpleCell>
      </Group>

      <Group header={<Header mode="secondary">Мои путешествия</Header>}>
        <Div>
          {travels.length === 0 ? (
            <Placeholder header="Нет путешествий">
              Добавьте своё первое путешествие!
            </Placeholder>
          ) : (
            travels.map((travel) => (
              <TravelCard
                key={travel.id}
                travel={travel}
                onClick={() => onOpenTravel(travel)}
              />
            ))
          )}
        </Div>
      </Group>
    </Panel>
  );
}
