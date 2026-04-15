/**
 * AppContext для централизованного управления состоянием приложения
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getCurrentUser, setCurrentUserNames } from '../components/StoriesBar';
import { useVKUser } from '../hooks/useVKUser';

const AppContext = createContext(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activePanel, setActivePanel] = useState('feed');
  const [activeStory, setActiveStory] = useState(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [storyAuthorId, setStoryAuthorId] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [addToExistingStory, setAddToExistingStory] = useState(false);

  const vkUser = useVKUser();

  // Sync VK user data
  useEffect(() => {
    if (vkUser.user?.first_name) {
      const updated = setCurrentUserNames(vkUser.user.first_name, vkUser.user.last_name || '');
      setCurrentUser(updated);
    }
  }, [vkUser.user]);

  // Navigation handlers
  const navigateTo = useCallback((panel) => {
    setActivePanel(panel);
  }, []);

  const openPost = useCallback((post) => {
    setSelectedPost(post);
    setActivePanel('postDetail');
  }, []);

  const closePost = useCallback(() => {
    setSelectedPost(null);
    setActivePanel('feed');
  }, []);

  const openTravel = useCallback((travel) => {
    setSelectedTravel(travel);
    setActivePanel('travelDetail');
  }, []);

  const closeTravel = useCallback(() => {
    setSelectedTravel(null);
    setActivePanel('profile');
  }, []);

  // Story handlers
  const openStoryCreator = useCallback((addToExisting = false) => {
    setAddToExistingStory(addToExisting);
    setShowStoryCreator(true);
  }, []);

  const closeStoryCreator = useCallback(() => {
    setShowStoryCreator(false);
    setAddToExistingStory(false);
  }, []);

  const openStoryViewer = useCallback((stories, index, authorId) => {
    setActiveStory(stories);
    setStoryIndex(index);
    setStoryAuthorId(authorId);
  }, []);

  const closeStoryViewer = useCallback(() => {
    setActiveStory(null);
    setStoryIndex(0);
    setStoryAuthorId(null);
  }, []);

  // Post handlers
  const openCreatePost = useCallback(() => {
    setShowCreatePost(true);
  }, []);

  const closeCreatePost = useCallback(() => {
    setShowCreatePost(false);
  }, []);

  // User handlers
  const updateUser = useCallback((userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  }, []);

  const value = {
    // State
    currentUser,
    activePanel,
    activeStory,
    storyIndex,
    storyAuthorId,
    selectedPost,
    selectedTravel,
    showCreatePost,
    showStoryCreator,
    addToExistingStory,
    vkUser,

    // Navigation
    navigateTo,
    setActivePanel,

    // Posts
    openPost,
    closePost,
    openCreatePost,
    closeCreatePost,

    // Stories
    openStoryCreator,
    closeStoryCreator,
    openStoryViewer,
    closeStoryViewer,

    // Travels
    openTravel,
    closeTravel,

    // User
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppContext;
