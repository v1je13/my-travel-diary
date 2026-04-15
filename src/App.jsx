import React, { useState } from "react";
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  View,
  Epic,
  Tabbar,
  TabbarItem,
} from "@vkontakte/vkui";

// Импортируем иконки
import MapIcon from "./assets/NavigationIcon/MapIcon.png";
import DiaryIcon from "./assets/NavigationIcon/DiaryIcon.png";
import ProfileIcon from "./assets/NavigationIcon/ProfileIcon.png";

import Feed from "./panels/Feed";
import Search from "./panels/Search";
import Profile from "./panels/Profile";
import TravelDetail from "./panels/TravelDetail";
import PostDetail from "./panels/PostDetail";
import StoryCreatorVK from "./panels/StoryCreatorVK";
import StoryViewerVK from "./components/StoryViewerVK";
import { AppProvider, useApp } from "./context/AppContext";

const MapIconComponent = () => (
  <img src={MapIcon} alt="Карта" style={{ width: 28, height: 28 }} />
);

const DiaryIconComponent = () => (
  <img src={DiaryIcon} alt="Дневник" style={{ width: 28, height: 28 }} />
);

const ProfileIconComponent = () => (
  <img src={ProfileIcon} alt="Профиль" style={{ width: 28, height: 28 }} />
);

function AppContent() {
  const [activeStory, setActiveStory] = useState("feed");
  const [activePanel, setActivePanel] = useState({
    feed: "feed",
    search: "search",
    profile: "profile",
  });
  const [editingStory, setEditingStory] = useState(null);
  const [viewingUserGroup, setViewingUserGroup] = useState(null);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [viewingStories, setViewingStories] = useState(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  const {
    selectedTravel,
    selectedPost,
    openTravel,
    closeTravel,
    openPost,
    closePost,
    openStoryCreator,
    closeStoryCreator,
    openStoryViewer,
    closeStoryViewer,
  } = useApp();

  const handleBackToProfile = () => {
    closeTravel();
  };

  const handleBackToFeed = () => {
    closePost();
  };

  const handleOpenPost = (post) => {
    openPost(post);
  };

  const handleOpenTravel = (travel) => {
    openTravel(travel);
  };

  // Story handlers
  const handleCreateStory = (addToExisting = false) => {
    openStoryCreator(addToExisting);
    setEditingStory(null);
  };

  const handleViewStory = (stories, index, userGroup = null) => {
    setViewingUserGroup(userGroup);
    setViewingStories(stories);
    setViewingIndex(index);
    openStoryViewer(stories, index, userGroup);
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    openStoryCreator(false);
  };

  const handleBackFromStoryCreator = () => {
    setEditingStory(null);
    closeStoryCreator();
  };

  const handleBackFromStoryViewer = () => {
    setViewingUserGroup(null);
    closeStoryViewer();
  };

  const handleDeleteStory = async (storyId) => {
    const { deleteStory } = await import("./services/api");
    await deleteStory(storyId);
    setFeedRefreshKey((k) => k + 1);
  };

  const handlePublishStory = (story) => {
    setFeedRefreshKey((k) => k + 1);
    closeStoryCreator();
  };

  const handleNextUserStory = () => {
    setViewingUserGroup(null);
  };

  const handlePrevUserStory = () => {
    setViewingUserGroup(null);
  };

  const handleStoryReply = (reply) => {
    console.log('Story reply:', reply);
  };

  const handleMarkStoryViewed = (index) => {
    console.log('Story viewed at index:', index);
  };

  const addToExistingMode = editingStory !== null;

  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot>
          <Epic
            activeStory={activeStory}
            tabbar={
              activePanel.feed === "storyCreator" ||
              activePanel.feed === "storyViewer" ? null : (
                <Tabbar style={{ background: "#c8d28c" }}>
                  <TabbarItem
                    onClick={() => setActiveStory("feed")}
                    selected={activeStory === "feed"}
                    text="Карта"
                  >
                    <MapIconComponent />
                  </TabbarItem>
                  <TabbarItem
                    onClick={() => setActiveStory("search")}
                    selected={activeStory === "search"}
                    text="Дневник"
                  >
                    <DiaryIconComponent />
                  </TabbarItem>
                  <TabbarItem
                    onClick={() => setActiveStory("profile")}
                    selected={activeStory === "profile"}
                    text="Профиль"
                  >
                    <ProfileIconComponent />
                  </TabbarItem>
                </Tabbar>
              )
            }
          >
            <View id="feed" activePanel={activePanel.feed}>
              <Feed
                key={feedRefreshKey}
                nav="feed"
                onOpenPost={handleOpenPost}
                onCreateStory={handleCreateStory}
                onViewStory={handleViewStory}
                onEditStory={handleEditStory}
              />
              <PostDetail
                nav="postDetail"
                post={selectedPost}
                onBack={handleBackToFeed}
              />
              <StoryCreatorVK
                nav="storyCreator"
                onBack={handleBackFromStoryCreator}
                onPublish={handlePublishStory}
                existingStory={editingStory}
                addToExisting={addToExistingMode}
              />
              <StoryViewerVK
                nav="storyViewer"
                stories={viewingStories || []}
                initialIndex={viewingIndex}
                onClose={handleBackFromStoryViewer}
                onNextUser={handleNextUserStory}
                onPrevUser={handlePrevUserStory}
                onEdit={handleEditStory}
                onDelete={handleDeleteStory}
                onReply={handleStoryReply}
                onMarkViewed={handleMarkStoryViewed}
                onPublish={(story) => {
                  handleCreateStory(true);
                }}
                userGroup={viewingUserGroup}
              />
            </View>

            <View id="search" activePanel={activePanel.search}>
              <Search nav="search" onOpenPost={handleOpenPost} />
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

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
