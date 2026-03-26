import React, { useState } from "react";
import {
  Panel,
  PanelHeader,
  Group,
  Div,
  Text,
  Button,
  Header,
  Avatar,
  HorizontalScroll,
  Placeholder,
  Tabs,
  TabsItem,
} from "@vkontakte/vkui";
import PostCard from "../components/PostCard";
import Loader from "../components/Loader";

// Данные постов с разными категориями
const allPosts = [
  // Отели (7 постов)
  {
    id: 1,
    author: "Анна Смирнова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "2 часа назад",
    category: "hotels",
    text: "Невероятный отдых в Grand Hotel Europe! Шикарный сервис, вкуснейшие завтраки, удобное расположение в центре Петербурга. Обязательно вернусь!",
    likes: 42,
    comments: 12,
    reposts: 5,
    hotel: {
      name: "Grand Hotel Europe",
      rating: 4.8,
      price: "от 8500 ₽",
      city: "Санкт-Петербург"
    },
    images: ["https://via.placeholder.com/400x200?text=Grand+Hotel+1", "https://via.placeholder.com/400x200?text=Grand+Hotel+2"]
  },
  {
    id: 2,
    author: "Михаил Волков",
    avatar: "https://vk.com/images/camera_100.png",
    date: "вчера",
    category: "hotels",
    text: "Mountain View Resort в Сочи — это любовь с первого взгляда! Вид на горы захватывает дух, номера просторные, персонал приветливый. Рекомендую!",
    likes: 28,
    comments: 5,
    reposts: 2,
    hotel: {
      name: "Mountain View Resort",
      rating: 4.6,
      price: "от 12000 ₽",
      city: "Сочи"
    },
    images: ["https://via.placeholder.com/400x200?text=Mountain+View"]
  },
  {
    id: 3,
    author: "Елена Козлова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "3 дня назад",
    category: "hotels",
    text: "Seaside Paradise в Анталии — райское место! Всё включено на высшем уровне, анимация каждый вечер, море рядом. Отдых мечты! 🏖️",
    likes: 156,
    comments: 34,
    reposts: 12,
    hotel: {
      name: "Seaside Paradise",
      rating: 4.9,
      price: "от 15000 ₽",
      city: "Анталья"
    },
    images: ["https://via.placeholder.com/400x200?text=Seaside+Paradise+1", "https://via.placeholder.com/400x200?text=Seaside+Paradise+2"]
  },
  {
    id: 4,
    author: "Дмитрий Новиков",
    avatar: "https://vk.com/images/camera_100.png",
    date: "5 дней назад",
    category: "hotels",
    text: "Ritz Carlton в Москве — роскошь во всем! Отличный спа-центр, рестораны с изысканной кухней, вид на город завораживает.",
    likes: 89,
    comments: 23,
    reposts: 8,
    hotel: {
      name: "Ritz Carlton",
      rating: 4.9,
      price: "от 25000 ₽",
      city: "Москва"
    },
    images: ["https://via.placeholder.com/400x200?text=Ritz+Carlton"]
  },
  {
    id: 5,
    author: "Ольга Морозова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "неделю назад",
    category: "hotels",
    text: "Four Seasons в Москве — идеальное место для романтического уикенда! Шикарные номера, отличный сервис, центр города.",
    likes: 67,
    comments: 15,
    reposts: 4,
    hotel: {
      name: "Four Seasons",
      rating: 4.8,
      price: "от 22000 ₽",
      city: "Москва"
    },
    images: ["https://via.placeholder.com/400x200?text=Four+Seasons"]
  },
  {
    id: 13,
    author: "Екатерина Новикова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "2 дня назад",
    category: "hotels",
    text: "St. Regis в Санкт-Петербурге — идеальный выбор для бизнес-поездки! Отличные конференц-залы, роскошные номера, ресторан с панорамным видом.",
    likes: 56,
    comments: 12,
    reposts: 3,
    hotel: {
      name: "St. Regis",
      rating: 4.9,
      price: "от 18000 ₽",
      city: "Санкт-Петербург"
    },
    images: ["https://via.placeholder.com/400x200?text=St+Regis"]
  },
  {
    id: 16,
    author: "Денис Петров",
    avatar: "https://vk.com/images/camera_100.png",
    date: "вчера",
    category: "hotels",
    text: "Ararat Park Hyatt Moscow — шикарный отель с видом на Кремль! Отличный сервис, рестораны высокой кухни, бассейн на крыше.",
    likes: 134,
    comments: 28,
    reposts: 11,
    hotel: {
      name: "Ararat Park Hyatt",
      rating: 4.9,
      price: "от 28000 ₽",
      city: "Москва"
    },
    images: ["https://via.placeholder.com/400x200?text=Ararat+Park+Hyatt"]
  },
  
  // Горы (4 поста)
  {
    id: 6,
    author: "Сергей Горный",
    avatar: "https://vk.com/images/camera_100.png",
    date: "2 дня назад",
    category: "mountains",
    text: "Восхождение на Эльбрус! Незабываемые впечатления, захватывающие виды и море адреналина. Горы — это моя страсть! 🏔️",
    likes: 234,
    comments: 56,
    reposts: 23,
    location: "Эльбрус, Кабардино-Балкария",
    difficulty: "сложный",
    duration: "5 дней",
    images: ["https://via.placeholder.com/400x200?text=Elbrus+1", "https://via.placeholder.com/400x200?text=Elbrus+2"]
  },
  {
    id: 7,
    author: "Алексей Белов",
    avatar: "https://vk.com/images/camera_100.png",
    date: "4 дня назад",
    category: "mountains",
    text: "Алтай — место силы! Поход к горе Белуха, чистейший воздух, невероятная природа. Обязательно вернусь сюда снова!",
    likes: 178,
    comments: 42,
    reposts: 15,
    location: "Гора Белуха, Алтай",
    difficulty: "средний",
    duration: "7 дней",
    images: ["https://via.placeholder.com/400x200?text=Altai+1", "https://via.placeholder.com/400x200?text=Altai+2"]
  },
  {
    id: 8,
    author: "Ирина Соколова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "6 дней назад",
    category: "mountains",
    text: "Крымские горы весной — это сказка! Цветущие поля, древние тропы, уютные кафе. Идеальное место для хайкинга! 🌸",
    likes: 145,
    comments: 31,
    reposts: 9,
    location: "Крымские горы",
    difficulty: "легкий",
    duration: "3 дня",
    images: ["https://via.placeholder.com/400x200?text=Crimea+Mountains"]
  },
  {
    id: 14,
    author: "Павел Соколов",
    avatar: "https://vk.com/images/camera_100.png",
    date: "4 дня назад",
    category: "mountains",
    text: "Поход к озеру Рица в Абхазии! Горы, водопады, чистейшее озеро — это было незабываемо!",
    likes: 167,
    comments: 38,
    reposts: 12,
    location: "Озеро Рица, Абхазия",
    difficulty: "легкий",
    duration: "2 дня",
    images: ["https://via.placeholder.com/400x200?text=Ritsa"]
  },
  
  // Пляжи (5 постов)
  {
    id: 9,
    author: "Мария Лебедева",
    avatar: "https://vk.com/images/camera_100.png",
    date: "1 день назад",
    category: "beaches",
    text: "Мальдивы — рай на Земле! Белоснежный песок, бирюзовая вода, закаты невероятной красоты. Отдых, который запомнится на всю жизнь! 🏝️",
    likes: 456,
    comments: 89,
    reposts: 45,
    location: "Мальдивы",
    duration: "10 дней",
    images: ["https://via.placeholder.com/400x200?text=Maldives+1", "https://via.placeholder.com/400x200?text=Maldives+2"]
  },
  {
    id: 10,
    author: "Андрей Кузнецов",
    avatar: "https://vk.com/images/camera_100.png",
    date: "3 дня назад",
    category: "beaches",
    text: "Пхукет, Таиланд — настоящий рай для серфингистов! Отличные волны, тусовки до утра, вкусная еда. Вернусь обязательно!",
    likes: 289,
    comments: 67,
    reposts: 21,
    location: "Пхукет, Таиланд",
    duration: "12 дней",
    images: ["https://via.placeholder.com/400x200?text=Phuket+1", "https://via.placeholder.com/400x200?text=Phuket+2"]
  },
  {
    id: 11,
    author: "Татьяна Воронова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "5 дней назад",
    category: "beaches",
    text: "Бали — остров богов! Пляжи, храмы, джунгли, йога на рассвете. Это место меняет сознание! 🧘‍♀️",
    likes: 312,
    comments: 78,
    reposts: 34,
    location: "Бали, Индонезия",
    duration: "14 дней",
    images: ["https://via.placeholder.com/400x200?text=Bali+1", "https://via.placeholder.com/400x200?text=Bali+2"]
  },
  {
    id: 12,
    author: "Николай Павлов",
    avatar: "https://vk.com/images/camera_100.png",
    date: "неделю назад",
    category: "beaches",
    text: "Крым, пляжи Алушты — отличный бюджетный отдых! Чистое море, галечные пляжи, много кафе. Для тех, кто любит комфорт и экономию!",
    likes: 98,
    comments: 24,
    reposts: 7,
    location: "Алушта, Крым",
    duration: "7 дней",
    images: ["https://via.placeholder.com/400x200?text=Alushta"]
  },
  {
    id: 15,
    author: "Алина Федорова",
    avatar: "https://vk.com/images/camera_100.png",
    date: "6 дней назад",
    category: "beaches",
    text: "Боракай, Филиппины — белоснежный песок, бирюзовая вода, потрясающие закаты! Рай для дайверов! 🤿",
    likes: 423,
    comments: 95,
    reposts: 38,
    location: "Боракай, Филиппины",
    duration: "9 дней",
    images: ["https://via.placeholder.com/400x200?text=Boracay"]
  }
];

export default function Feed({ nav, onOpenPost }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filteredPosts, setFilteredPosts] = useState(allPosts);

  const stories = [
    { id: 1, name: "Моя история", avatar: "https://vk.com/images/camera_100.png", isMine: true },
    { id: 2, name: "Анна", avatar: "https://vk.com/images/camera_100.png", seen: false },
    { id: 3, name: "Михаил", avatar: "https://vk.com/images/camera_100.png", seen: false },
    { id: 4, name: "Елена", avatar: "https://vk.com/images/camera_100.png", seen: true },
    { id: 5, name: "Сергей", avatar: "https://vk.com/images/camera_100.png", seen: false },
    { id: 6, name: "Ольга", avatar: "https://vk.com/images/camera_100.png", seen: true },
    { id: 7, name: "Дмитрий", avatar: "https://vk.com/images/camera_100.png", seen: false },
    { id: 8, name: "Мария", avatar: "https://vk.com/images/camera_100.png", seen: true },
  ];

  // Фильтрация постов при смене вкладки
  const filterPosts = (category) => {
    setActiveTab(category);
    if (category === "all") {
      setFilteredPosts(allPosts);
    } else if (category === "hotels") {
      setFilteredPosts(allPosts.filter(post => post.category === "hotels"));
    } else if (category === "mountains") {
      setFilteredPosts(allPosts.filter(post => post.category === "mountains"));
    } else if (category === "beaches") {
      setFilteredPosts(allPosts.filter(post => post.category === "beaches"));
    }
  };

  const handleLike = (postId) => {
    setFilteredPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId) => {
    console.log("Комментарий к посту", postId);
  };

  const handleShare = (postId) => {
    console.log("Поделиться постом", postId);
  };

  const handlePostClick = (post) => {
    if (onOpenPost) {
      onOpenPost(post);
    }
  };

  if (loading) {
    return (
      <Panel nav={nav}>
        <PanelHeader>Лента</PanelHeader>
        <Loader />
      </Panel>
    );
  }

  return (
    <Panel nav={nav}>
      <PanelHeader>Лента путешествий</PanelHeader>
      
      {/* Истории */}
      <Group header={<Header mode="secondary">Истории</Header>}>
        <HorizontalScroll>
          <div style={{ display: "flex", padding: "12px 16px", gap: 12 }}>
            {stories.map(story => (
              <div key={story.id} style={{ textAlign: "center", cursor: "pointer" }}>
                <Avatar 
                  size={64} 
                  src={story.avatar} 
                  style={story.seen ? { opacity: 0.5 } : {}}
                />
                <Text style={{ fontSize: 12, marginTop: 4 }}>{story.name}</Text>
                {story.isMine && <Text style={{ fontSize: 10, color: "var(--vkui--color_text_secondary)" }}>➕</Text>}
              </div>
            ))}
          </div>
        </HorizontalScroll>
      </Group>

      {/* Категории */}
      <Group>
        <Tabs>
          <TabsItem
            onClick={() => filterPosts("all")}
            selected={activeTab === "all"}
          >
            Все
          </TabsItem>
          <TabsItem
            onClick={() => filterPosts("hotels")}
            selected={activeTab === "hotels"}
          >
            🏨 Отели
          </TabsItem>
          <TabsItem
            onClick={() => filterPosts("mountains")}
            selected={activeTab === "mountains"}
          >
            🏔️ Горы
          </TabsItem>
          <TabsItem
            onClick={() => filterPosts("beaches")}
            selected={activeTab === "beaches"}
          >
            🏖️ Пляжи
          </TabsItem>
        </Tabs>
      </Group>

      {/* Счетчик постов */}
      <Div>
        <Text style={{ color: "var(--vkui--color_text_secondary)", fontSize: 14 }}>
          {filteredPosts.length} {getPostCountWord(filteredPosts.length)}
        </Text>
      </Div>

      {/* Лента постов */}
      <Group>
        {filteredPosts.length === 0 ? (
          <Placeholder header="Нет постов в этой категории">
            Будьте первым, кто поделится впечатлениями!
          </Placeholder>
        ) : (
          filteredPosts.map(post => (
            <div 
              key={post.id} 
              onClick={() => handlePostClick(post)} 
              style={{ cursor: "pointer" }}
            >
              <PostCard
                post={post}
                onLike={() => handleLike(post.id)}
                onComment={() => handleComment(post.id)}
                onShare={() => handleShare(post.id)}
              />
            </div>
          ))
        )}
      </Group>
    </Panel>
  );
}

function getPostCountWord(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "постов";
  }
  
  switch (lastDigit) {
    case 1:
      return "пост";
    case 2:
    case 3:
    case 4:
      return "поста";
    default:
      return "постов";
  }
}