/**
 * Типы данных для PropTypes
 */

import PropTypes from 'prop-types';

// Базовые типы
export const StoryType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  image: PropTypes.string,
  video: PropTypes.string,
  text: PropTypes.string,
  textColor: PropTypes.string,
  fontSize: PropTypes.number,
  stickers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      emoji: PropTypes.string.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
    })
  ),
  timestamp: PropTypes.number.isRequired,
  views: PropTypes.number,
  type: PropTypes.oneOf(['photo', 'video']).isRequired,
  authorName: PropTypes.string.isRequired,
  authorId: PropTypes.string.isRequired,
  authorAvatar: PropTypes.string,
  isMine: PropTypes.bool,
});

export const PostType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  author: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  date: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  image: PropTypes.string,
  video: PropTypes.string,
  type: PropTypes.oneOf(['photo', 'video', 'text']),
  likes: PropTypes.number,
  comments: PropTypes.number,
  reposts: PropTypes.number,
  userId: PropTypes.string,
  category: PropTypes.oneOf(['hotels', 'mountains', 'beaches', 'travel']),
  hotel: PropTypes.shape({
    name: PropTypes.string,
    city: PropTypes.string,
    rating: PropTypes.number,
    price: PropTypes.string,
  }),
  location: PropTypes.string,
  difficulty: PropTypes.oneOf(['легкий', 'средний', 'сложный']),
  duration: PropTypes.string,
  images: PropTypes.arrayOf(PropTypes.string),
});

export const CommentType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  postId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  author: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  text: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  userId: PropTypes.string,
});

export const UserType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  firstName: PropTypes.string.isRequired,
  lastName: PropTypes.string,
  displayName: PropTypes.string.isRequired,
  photo_200: PropTypes.string,
});

export const TravelType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hotelName: PropTypes.string.isRequired,
  city: PropTypes.string,
  country: PropTypes.string,
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  description: PropTypes.string,
  review: PropTypes.string,
  image: PropTypes.string,
});
