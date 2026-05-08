export const mockUser = {
  user: {
    email: 'test@example.com',
    token: 'mock-jwt-token',
    username: 'testuser',
    bio: 'I work at Conduit',
    image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
  },
};

export const mockProfile = {
  profile: {
    username: 'testuser',
    bio: 'I work at Conduit',
    image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
    following: false,
  },
};

export const mockTags = {
  tags: ['programming', 'javascript', 'angularjs', 'react', 'nodejs', 'rails', 'django', 'python'],
};

export const mockArticles = {
  articles: [
    {
      slug: 'how-to-build-webapps-that-scale',
      title: 'How to build webapps that scale',
      description: 'Web development technologies have evolved at an incredible clip over the past few years.',
      body: '# How to build webapps that scale\n\nWeb development technologies have evolved at an incredible clip over the past few years.\n\n## Introduction\n\nIn this article, we will explore the best practices for building scalable web applications.',
      tagList: ['programming', 'javascript'],
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
      favorited: false,
      favoritesCount: 42,
      author: {
        username: 'johndoe',
        bio: 'Developer and writer',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        following: false,
      },
    },
    {
      slug: 'the-future-of-ai',
      title: 'The future of AI in software development',
      description: 'Artificial intelligence is transforming how we write and maintain code.',
      body: 'AI is changing everything about software development.',
      tagList: ['programming', 'python'],
      createdAt: '2024-01-14T08:00:00.000Z',
      updatedAt: '2024-01-14T08:00:00.000Z',
      favorited: true,
      favoritesCount: 128,
      author: {
        username: 'janedoe',
        bio: 'AI researcher',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        following: true,
      },
    },
    {
      slug: 'introduction-to-react-hooks',
      title: 'Introduction to React Hooks',
      description: 'React Hooks let you use state and other React features without writing a class.',
      body: 'React Hooks are a powerful feature added in React 16.8.',
      tagList: ['react', 'javascript'],
      createdAt: '2024-01-13T14:00:00.000Z',
      updatedAt: '2024-01-13T14:00:00.000Z',
      favorited: false,
      favoritesCount: 56,
      author: {
        username: 'johndoe',
        bio: 'Developer and writer',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        following: false,
      },
    },
  ],
  articlesCount: 3,
};

export const mockArticle = {
  article: mockArticles.articles[0],
};

export const mockComments = {
  comments: [
    {
      id: '1',
      body: 'Great article! Very informative.',
      createdAt: '2024-01-16T12:00:00.000Z',
      author: {
        username: 'janedoe',
        bio: 'AI researcher',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        following: false,
      },
    },
    {
      id: '2',
      body: 'Thanks for sharing this knowledge with the community.',
      createdAt: '2024-01-17T09:30:00.000Z',
      author: {
        username: 'testuser',
        bio: 'I work at Conduit',
        image: 'https://api.realworld.io/images/smiley-cyrus.jpeg',
        following: false,
      },
    },
  ],
};
