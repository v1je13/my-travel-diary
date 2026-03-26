import React, { useState } from "react";
import {
  Panel,
  PanelHeader,
  Search,
  Group,
  Placeholder,
  Div,
  Card,
  Text,
  Title,
  Avatar,
  Button,
} from "@vkontakte/vkui";
import Loader from "../components/Loader";

const mockHotels = [
  {
    id: 1,
    name: "Grand Hotel Europe",
    city: "Санкт-Петербург",
    country: "Россия",
    rating: 4.8,
    price: "от 8500 ₽",
    image: "https://via.placeholder.com/48",
  },
  {
    id: 2,
    name: "Mountain View Resort",
    city: "Сочи",
    country: "Россия",
    rating: 4.6,
    price: "от 12000 ₽",
    image: "https://via.placeholder.com/48",
  },
  {
    id: 3,
    name: "Seaside Paradise",
    city: "Анталья",
    country: "Турция",
    rating: 4.9,
    price: "от 15000 ₽",
    image: "https://via.placeholder.com/48",
  },
];

export default function SearchPanel({ nav }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = (value) => {
    setQuery(value);
    setLoading(true);
    
    setTimeout(() => {
      const filtered = mockHotels.filter(hotel =>
        hotel.name.toLowerCase().includes(value.toLowerCase()) ||
        hotel.city.toLowerCase().includes(value.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 300);
  };

  return (
    <Panel nav={nav}>
      <PanelHeader>Поиск отелей</PanelHeader>
      <Group>
        <Search
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Введите название отеля или город"
        />
      </Group>
      
      {loading && <Loader />}
      
      {!loading && query && results.length === 0 && (
        <Placeholder
          header="Ничего не найдено"
          action={<Button onClick={() => setQuery("")}>Очистить поиск</Button>}
        >
          🔍 Попробуйте изменить запрос
        </Placeholder>
      )}
      
      {!loading && !query && (
        <Placeholder header="Начните поиск">
          🔍 Введите название отеля или города
        </Placeholder>
      )}
      
      {!loading && results.length > 0 && (
        <Group>
          <Div>
            <Text style={{ marginBottom: 12, color: "var(--vkui--color_text_secondary)" }}>
              Найдено {results.length} отелей
            </Text>
            {results.map(hotel => (
              <Card key={hotel.id} mode="shadow" style={{ marginBottom: 12 }}>
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    <Avatar size={48} src={hotel.image} />
                    <div style={{ marginLeft: 12, flex: 1 }}>
                      <Title level="3" style={{ marginBottom: 4 }}>
                        {hotel.name}
                      </Title>
                      <Text style={{ color: "var(--vkui--color_text_secondary)" }}>
                        📍 {hotel.city}, {hotel.country}
                      </Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span>⭐</span>
                      <Text>{hotel.rating}</Text>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontWeight: "bold", color: "var(--vkui--color_text_accent)" }}>
                      {hotel.price}
                    </Text>
                    <Button size="m" mode="tertiary">
                      Подробнее
                    </Button>
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