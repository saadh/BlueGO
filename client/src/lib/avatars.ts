// Preset avatar options for students
export const PRESET_AVATARS = [
  {
    id: "avatar-1",
    name: "Happy Cat",
    emoji: "😺",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=happy-cat&backgroundColor=b6e3f4",
  },
  {
    id: "avatar-2",
    name: "Cool Dog",
    emoji: "🐶",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=cool-dog&backgroundColor=c0aede",
  },
  {
    id: "avatar-3",
    name: "Silly Monkey",
    emoji: "🐵",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=silly-monkey&backgroundColor=ffd5dc",
  },
  {
    id: "avatar-4",
    name: "Cute Panda",
    emoji: "🐼",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=cute-panda&backgroundColor=d1d4f9",
  },
  {
    id: "avatar-5",
    name: "Funny Lion",
    emoji: "🦁",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=funny-lion&backgroundColor=ffdfbf",
  },
  {
    id: "avatar-6",
    name: "Sweet Bunny",
    emoji: "🐰",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=sweet-bunny&backgroundColor=feca57",
  },
  {
    id: "avatar-7",
    name: "Brave Bear",
    emoji: "🐻",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=brave-bear&backgroundColor=48dbfb",
  },
  {
    id: "avatar-8",
    name: "Smart Fox",
    emoji: "🦊",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=smart-fox&backgroundColor=ff9ff3",
  },
  {
    id: "avatar-9",
    name: "Wild Tiger",
    emoji: "🐯",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=wild-tiger&backgroundColor=54a0ff",
  },
  {
    id: "avatar-10",
    name: "Friendly Koala",
    emoji: "🐨",
    url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=friendly-koala&backgroundColor=1dd1a1",
  },
] as const;

// Fun celebration GIFs/images for dismissal completion
export const CELEBRATION_GIFS = [
  {
    id: "celebrate-1",
    url: "https://media.giphy.com/media/g9582DNuQppxC/giphy.gif",
    alt: "Celebration!",
  },
  {
    id: "celebrate-2",
    url: "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
    alt: "Party Time!",
  },
  {
    id: "celebrate-3",
    url: "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
    alt: "High Five!",
  },
  {
    id: "celebrate-4",
    url: "https://media.giphy.com/media/111ebonMs90YLu/giphy.gif",
    alt: "Awesome!",
  },
  {
    id: "celebrate-5",
    url: "https://media.giphy.com/media/3oz8xAFtqoOUUrsh7W/giphy.gif",
    alt: "Victory!",
  },
  {
    id: "celebrate-6",
    url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
    alt: "Woohoo!",
  },
  {
    id: "celebrate-7",
    url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    alt: "Happy Dance!",
  },
  {
    id: "celebrate-8",
    url: "https://media.giphy.com/media/kyLYXonQYYfwYDIeZl/giphy.gif",
    alt: "You Rock!",
  },
  {
    id: "celebrate-9",
    url: "https://media.giphy.com/media/l0HlR3kHtkgFbYfgQ/giphy.gif",
    alt: "Super Star!",
  },
  {
    id: "celebrate-10",
    url: "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif",
    alt: "Amazing!",
  },
] as const;

// Get a random celebration GIF
export function getRandomCelebrationGif() {
  const randomIndex = Math.floor(Math.random() * CELEBRATION_GIFS.length);
  return CELEBRATION_GIFS[randomIndex];
}

// Get preset avatar by ID
export function getPresetAvatarById(id: string) {
  return PRESET_AVATARS.find((avatar) => avatar.id === id);
}

// Check if a URL is a preset avatar
export function isPresetAvatar(url: string | null | undefined): boolean {
  if (!url) return false;
  return PRESET_AVATARS.some((avatar) => avatar.id === url || avatar.url === url);
}

// Get avatar URL (handles both preset IDs and custom URLs)
export function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;

  // Check if it's a preset avatar ID
  const preset = getPresetAvatarById(avatarUrl);
  if (preset) return preset.url;

  // Otherwise, treat it as a custom URL
  return avatarUrl;
}
