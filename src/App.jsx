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
import { deleteStory } from "./api";

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

export default function App() {
  const [activeStory, setActiveStory] = useState("feed");
  const [activePanel, setActivePanel] = useState({
    feed: "feed",
    search: "search",
    profile: "profile",
  });
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [viewingStories, setViewingStories] = useState(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [viewingUserGroup, setViewingUserGroup] = useState(null);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [addToExistingMode, setAddToExistingMode] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleOpenTravel = (travel) => {
    setSelectedTravel(travel);
    setActivePanel((prev) => ({ ...prev, profile: "travelDetail" }));
  };

  const handleBackToProfile = () => {
    setSelectedTravel(null);
    setActivePanel((prev) => ({ ...prev, profile: "profile" }));
  };

  const handleOpenPost = (post) => {
    setSelectedPost(post);
    setActivePanel((prev) => ({ ...prev, feed: "postDetail" }));
  };

  const handleBackToFeed = () => {
    setSelectedPost(null);
    setActivePanel((prev) => ({ ...prev, feed: "feed" }));
  };

  // Story handlers
  const handleCreateStory = (addToExisting = false) => {
    setAddToExistingMode(addToExisting);
    setEditingStory(null);
    setActivePanel((prev) => ({ ...prev, feed: "storyCreator" }));
  };

  const handleViewStory = (stories, index, userGroup = null) => {
    setViewingStories(stories);
    setViewingIndex(index);
    setViewingUserGroup(userGroup);
    setActivePanel((prev) => ({ ...prev, feed: "storyViewer" }));
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setActivePanel((prev) => ({ ...prev, feed: "storyCreator" }));
  };

  const handleBackFromStoryCreator = () => {
    setEditingStory(null);
    setAddToExistingMode(false);
    setActivePanel((prev) => ({ ...prev, feed: "feed" }));
  };

  const handleBackFromStoryViewer = () => {
    setViewingStories(null);
    setViewingUserGroup(null);
    setActivePanel((prev) => ({ ...prev, feed: "feed" }));
  };

  const handleNextUserStory = () => {
    // Navigate to next user's stories
    const allStories = JSON.parse(
      localStorage.getItem("travelDiaryStories") || "[]",
    );
    // Logic to find and navigate to next user's stories
    handleBackFromStoryViewer();
  };

  const handlePrevUserStory = () => {
    // Navigate to previous user's stories
    if (viewingIndex > 0) {
      setViewingIndex(0);
    } else {
      handleBackFromStoryViewer();
    }
  };

  const handleMarkStoryViewed = (storyIndex) => {
    const viewed = JSON.parse(
      localStorage.getItem("travelDiaryViewedStories") || "[]",
    );
    if (viewingUserGroup) {
      viewed.push(`${viewingUserGroup}-${storyIndex}`);
    }
    localStorage.setItem(
      "travelDiaryViewedStories",
      JSON.stringify([...new Set(viewed)]),
    );
  };

  const handleStoryReply = (text) => {
    console.log("Story reply:", text);
    // Implement reply logic here
  };

  const handleDeleteStory = async (storyId) => {
    await deleteStory(storyId);
    setFeedRefreshKey((k) => k + 1);
  };

  const handlePublishStory = (story) => {
    setFeedRefreshKey((k) => k + 1);
    setActivePanel((prev) => ({ ...prev, feed: "feed" }));
  };

  const handlePublishToFeed = (post) => {
    setFeedRefreshKey((k) => k + 1);
    setActivePanel((prev) => ({ ...prev, feed: "feed" }));
  };

  const handleOpenCreatePost = () => {
    setShowCreatePost(true);
  };

  const handleCloseCreatePost = () => {
    setShowCreatePost(false);
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
