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
import SearchPanel from "./panels/Search";
import Profile from "./panels/Profile";
import TravelDetail from "./panels/TravelDetail";
import PostDetail from "./panels/PostDetail";
import StoryCreatorVK from "./panels/StoryCreatorVK";
import StoryViewerVK from "./components/StoryViewerVK";
import CreatePostModal from "./components/CreatePostModal";
import { deleteStory } from "./services/api";
import { AppProvider, useApp } from "./context/AppContext";

const MapIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2L2 7V22L14 26L26 22V7L14 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 14V26"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 7L14 14L26 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NotebookIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="6"
      y="4"
      width="16"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M10 10H18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 14H18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 18H15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="14" cy="10" r="5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 24C5 19.5817 8.58172 16 13 16H15C19.4183 16 23 19.5817 23 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
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
  const [showCreatePost, setShowCreatePost] = useState(false);

  const {
    selectedTravel,
    selectedPost,
    activeStory: contextActiveStory,
    activeStory: contextActivePanel,
    openTravel,
    closeTravel,
    openPost,
    closePost,
    openStoryCreator,
    closeStoryCreator,
    openStoryViewer,
    closeStoryViewer,
    openCreatePost,
    closeCreatePost,
  } = useApp();

  const handleBackToProfile = () => {
    closeTravel();
  };

  const handleBackToFeed = () => {
    closePost();
  };

  // Story handlers
  const handleCreateStory = (addToExisting = false) => {
    openStoryCreator(addToExisting);
    setEditingStory(null);
  };

  const handleViewStory = (stories, index, userGroup = null) => {
    setViewingUserGroup(userGroup);
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
    await deleteStory(storyId);
    setFeedRefreshKey((k) => k + 1);
  };

  const handlePublishStory = (story) => {
    setFeedRefreshKey((k) => k + 1);
    closeStoryCreator();
  };

  const handlePublishToFeed = (post) => {
    setFeedRefreshKey((k) => k + 1);
    closeCreatePost();
  };

  const handleOpenCreatePost = () => {
    openCreatePost();
  };

  const handleCloseCreatePost = () => {
    closeCreatePost();
  };

  const handlePostPublished = (savedPost) => {
    setFeedRefreshKey((k) => k + 1);
    setShowCreatePost(false);
  };

  return (
    <ConfigProvider>
      <AdaptivityProvider>
        <AppRoot>
          <Epic
            activeStory={activeStory}
            tabbar={
              activePanel.feed === "storyCreator" ||
              activePanel.feed === "storyViewer" ? null : (
                <Tabbar style={{ background: "#b5c47a" }}>
                  <TabbarItem
                    onClick={() => setActiveStory("feed")}
                    selected={activeStory === "feed"}
                    text="Карта"
                    aria-label="Карта"
                  >
                    <MapIcon />
                  </TabbarItem>
                  <TabbarItem
                    onClick={() => setActiveStory("search")}
                    selected={activeStory === "search"}
                    text="Дневник"
                    aria-label="Дневник"
                  >
                    <NotebookIcon />
                  </TabbarItem>
                  <TabbarItem
                    onClick={() => setActiveStory("profile")}
                    selected={activeStory === "profile"}
                    text="Профиль"
                    aria-label="Профиль"
                  >
                    <UserIcon />
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
                onOpenCreatePost={handleOpenCreatePost}
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
                onPublishToFeed={handlePublishToFeed}
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
                  // Navigate to story creator in "add to existing" mode
                  handleCreateStory(true);
                }}
                userGroup={viewingUserGroup}
              />
            </View>

            <View id="search" activePanel={activePanel.search}>
              <SearchPanel nav="search" onOpenPost={handleOpenPost} />
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
          <CreatePostModal
            visible={showCreatePost}
            onClose={handleCloseCreatePost}
            onPublished={handlePostPublished}
          />
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
