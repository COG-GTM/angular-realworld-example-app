export interface FixtureProfile {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
}

export interface FixtureArticle {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: FixtureProfile;
}

const AVATAR = 'https://api.realworld.show/images/smiley-cyrus.jpeg';

export const TAGS = [
  'welcome',
  'introduction',
  'implementations',
  'codebaseShow',
  'dragons',
  'training',
  'ipsum',
  'qui',
  'sed',
  'quis',
];

export const AUTHOR: FixtureProfile = {
  username: 'conduit_author',
  bio: 'Writing about frameworks, migrations and pixels.',
  image: AVATAR,
  following: false,
};

export const CURRENT_USER = {
  email: 'reader@conduit.test',
  token: 'fixture-token',
  username: 'conduit_reader',
  bio: 'Reader of the RealWorld example app.',
  image: AVATAR,
};

export const CURRENT_USER_PROFILE: FixtureProfile = {
  username: CURRENT_USER.username,
  bio: CURRENT_USER.bio,
  image: CURRENT_USER.image,
  following: false,
};

function makeArticle(index: number): FixtureArticle {
  const number = index + 1;
  return {
    slug: `fixture-article-${number}`,
    title: `Fixture article number ${number}`,
    description: `A deterministic description for fixture article number ${number}.`,
    body: `## Heading ${number}\n\nThis is the **markdown body** of fixture article ${number}.\n\n- item one\n- item two\n\n[RealWorld](https://realworld.io)\n`,
    tagList: [TAGS[index % TAGS.length], TAGS[(index + 1) % TAGS.length]],
    createdAt: `2024-0${(index % 9) + 1}-1${index % 9}T12:00:00.000Z`,
    updatedAt: `2024-0${(index % 9) + 1}-1${index % 9}T12:00:00.000Z`,
    favorited: index % 3 === 0,
    favoritesCount: 10 + index,
    author: AUTHOR,
  };
}

export const ARTICLES: FixtureArticle[] = Array.from({ length: 25 }, (_, index) => makeArticle(index));

export const ARTICLE = ARTICLES[0];

export const COMMENTS = [
  {
    id: '1',
    createdAt: '2024-03-01T09:30:00.000Z',
    updatedAt: '2024-03-01T09:30:00.000Z',
    body: 'Great write-up, this cleared up a lot for me.',
    author: AUTHOR,
  },
  {
    id: '2',
    createdAt: '2024-03-02T15:45:00.000Z',
    updatedAt: '2024-03-02T15:45:00.000Z',
    body: 'I ported the same thing last year — the CSS scoping was the hard part.',
    author: CURRENT_USER_PROFILE,
  },
];
