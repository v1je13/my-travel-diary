import React, { useState } from "react";
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  Epic,
  Tabbar,
  TabbarItem,
  View,
} from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";

import Feed from "./panels/Feed";
import Search from "./panels/Search";
import Profile from "./panels/Profile";
import TravelDetail from "./panels/TravelDetail";
import PostDetail from "./panels/PostDetail";

export default function App() {
  const [activeStory, setActiveStory] = useState("feed");
  const [activePanel, setActivePanel] = useState({
    feed: "feed",
    search: "search",
    profile: "profile"
  });
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const handleOpenTravel = (travel) => {
    setSelectedTravel(travel);
    setActivePanel(prev => ({ ...prev, profile: "travelDetail" }));
  };

  const handleBackToProfile = () => {
    setSelectedTravel(null);
    setActivePanel(prev => ({ ...prev, profile: "profile" }));
  };

  const handleOpenPost = (post) => {
    setSelectedPost(post);
    setActivePanel(prev => ({ ...prev, feed: "postDetail" }));
  };

  const handleBackToFeed = () => {
    setSelectedPost(null);
    setActivePanel(prev => ({ ...prev, feed: "feed" }));
  };

  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot>
          <Epic
            activeStory={activeStory}
            tabbar={
              <Tabbar>
                <TabbarItem
                  onClick={() => setActiveStory("feed")}
                  selected={activeStory === "feed"}
                  text="Лента"
                  aria-label="Лента"
                >
                  📰
                </TabbarItem>
                <TabbarItem
                  onClick={() => setActiveStory("search")}
                  selected={activeStory === "search"}
                  text="Поиск"
                  aria-label="Поиск"
                >
                  🔍
                </TabbarItem>
                <TabbarItem
                  onClick={() => setActiveStory("profile")}
                  selected={activeStory === "profile"}
                  text="Профиль"
                  aria-label="Профиль"
                >
                  👤
                </TabbarItem>
              </Tabbar>
            }
          >
            <View id="feed" activePanel={activePanel.feed}>
              <Feed nav="feed" onOpenPost={handleOpenPost} />
              <PostDetail 
                nav="postDetail" 
                post={selectedPost} 
                onBack={handleBackToFeed}
              />
            </View>

            <View id="search" activePanel={activePanel.search}>
              <Search nav="search" />
            </View>

            <View id="profile" activePanel={activePanel.profile}>
              <Profile nav="profile" onOpenTravel={handleOpenTravel} />
              <TravelDetail 
                nav="travelDetail" 
                travel={selectedTravel} 
                onBack={handleBackToProfile}
              />
            </View>
          </Epic>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
}