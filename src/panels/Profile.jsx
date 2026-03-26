import React, { useState, useEffect } from "react";
import {
  Panel,
  PanelHeader,
  Group,
  Avatar,
  Div,
  Title,
  Text,
  Button,
  Header,
  CellButton,
  SimpleCell,
  Counter,
  Placeholder,
} from "@vkontakte/vkui";
import { useVKUser } from "../hooks/useVKUser";
import TravelCard from "../components/TravelCard";
import Loader from "../components/Loader";

export default function Profile({ nav, onOpenTravel }) {
  const { user, loading: userLoading, error } = useVKUser();
  const [travels, setTravels] = useState([]);
  const [travelsLoading, setTravelsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    countries: 0,
    days: 0,
  });

  useEffect(() => {
    setTimeout(() => {
      const mockTravels = [
        {
          id: 1,
          hotelName: "Grand Hotel Europe",
          city: "Санкт-Петербург",
          country: "Россия",
          startDate: "2024-06-15",
          endDate: "2024-06-20",
          rating: 4.8,
          description: "Прекрасный отель в центре города. Отличный сервис, вкусные завтраки.",
          image: "https://via.placeholder.com/300x200?text=Grand+Hotel",
          price: "от 8500 ₽",
          review: "Очень понравилось! Обязательно вернусь сюда ещё раз.",
        },
        {
          id: 2,
          hotelName: "Mountain View Resort",
          city: "Сочи",
          country: "Россия",
          startDate: "2024-07-10",
          endDate: "2024-07-17",
          rating: 4.6,
          description: "Уютный отель с видом на горы. Свежий воздух, бассейн.",
          image: "https://via.placeholder.com/300x200?text=Mountain+View",
          price: "от 12000 ₽",
          review: "Отличный отдых! Природа шикарная, персонал приветливый.",
        },
        {
          id: 3,
          hotelName: "Seaside Paradise",
          city: "Анталья",
          country: "Турция",
          startDate: "2024-08-05",
          endDate: "2024-08-15",
          rating: 4.9,
          description: "Шикарный пляжный отель. Всё включено, анимация.",
          image: "https://via.placeholder.com/300x200?text=Seaside+Paradise",
          price: "от 15000 ₽",
          review: "Лучший отдых! Обязательно приеду ещё.",
        },
      ];
      
      setTravels(mockTravels);
      setStats({
        total: mockTravels.length,
        countries: [...new Set(mockTravels.map(t => t.country))].length,
        days: mockTravels.reduce((sum, t) => {
          const days = Math.ceil((new Date(t.endDate) - new Date(t.startDate)) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0),
      });
      setTravelsLoading(false);
    }, 500);
  }, []);

  if (userLoading || travelsLoading) {
    return (
      <Panel nav={nav}>
        <PanelHeader>Профиль</PanelHeader>
        <Loader />
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
            action={<Button onClick={() => window.location.reload()}>Обновить</Button>}
          >
            Не удалось загрузить данные пользователя
          </Placeholder>
        </Group>
      </Panel>
    );
  }

  return (
    <Panel nav={nav}>
      <PanelHeader>Профиль</PanelHeader>

      <Group>
        <Div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
            <Avatar size={80} src={user?.photo_200} />
            <div style={{ marginLeft: 16 }}>
              <Title level="2">
                {user?.first_name} {user?.last_name}
              </Title>
              <Text style={{ color: "var(--vkui--color_text_secondary)" }}>
                ID: {user?.id}
              </Text>
            </div>
          </div>
          
          <div style={{ 
            display: "flex", 
            justifyContent: "space-around", 
            marginTop: 16, 
            padding: "12px 0", 
            background: "var(--vkui--color_background_secondary)", 
            borderRadius: 12 
          }}>
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
        <CellButton onClick={() => console.log("Добавить путешествие")}>
          ➕ Добавить путешествие
        </CellButton>
        <SimpleCell indicator={<Counter mode="prominent">3</Counter>}>
          📚 Избранные отели
        </SimpleCell>
        <SimpleCell>
          👍 Мои отзывы
        </SimpleCell>
      </Group>

      <Group header={<Header mode="secondary">Мои путешествия</Header>}>
        <Div>
          {travels.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48 }}>✈️</div>
              <Text style={{ marginTop: 12 }}>Пока нет путешествий</Text>
              <Button mode="tertiary" style={{ marginTop: 12 }} onClick={() => console.log("Добавить")}>
                Добавить первое путешествие
              </Button>
            </div>
          ) : (
            travels.map(travel => (
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