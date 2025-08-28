import { DreamEntry, Emotion, EmotionCategory } from '../types/dream';

const sampleDreamNarratives = [
  "I was flying over a vast ocean, feeling completely free and weightless. The water below sparkled like diamonds in the sunlight, and I could see dolphins jumping playfully in the waves. As I soared higher, I noticed a beautiful island in the distance with lush green forests and white sandy beaches.",
  
  "I found myself in my childhood home, but everything was slightly different. The walls were painted in colors I'd never seen before, and there were doors leading to rooms that didn't exist when I lived there. I kept searching for something important, but I couldn't remember what it was.",
  
  "I was walking through an endless library with books that seemed to glow from within. When I opened one, the words floated off the pages and danced around me like butterflies. An old wise woman appeared and told me that these were all the stories I had yet to live.",
  
  "I was late for an important exam, running through corridors that kept changing direction. Every time I thought I found the right classroom, it would transform into something else - a garden, a beach, or my grandmother's kitchen. Despite the chaos, I felt strangely calm and knew everything would work out.",
  
  "I discovered I could breathe underwater and was exploring a vibrant coral reef city. Fish swam between buildings made of pearl and seaweed, and merpeople welcomed me as if I belonged there. The silence was profound and peaceful, unlike anything I'd experienced in waking life.",
  
  "I was performing on stage in front of thousands of people, but instead of feeling nervous, I felt incredibly confident and powerful. My voice carried magic - when I sang, flowers bloomed in the audience and everyone's face lit up with joy. The applause sounded like ocean waves.",
  
  "I was in a vast desert under a sky filled with multiple moons. Each moon was a different color - silver, gold, blue, and pink. As I walked across the sand, my footsteps left trails of light that formed constellations behind me. Ancient pyramids appeared and disappeared like mirages.",
  
  "I was having dinner with deceased relatives, and we were all laughing and sharing stories as if no time had passed. The table was set in a beautiful garden that seemed to exist outside of time. They gave me advice about my current life situation, and I woke up feeling deeply comforted.",
  
  "I discovered a hidden door in my apartment that led to a parallel version of my life. In this other world, I had made different choices and was living a completely different existence. I could observe but not interact, like watching a movie of an alternate version of myself.",
  
  "I was shrunk down to the size of an ant and was exploring my own garden from this tiny perspective. Blades of grass became towering trees, and water droplets were like crystal caves. I met other tiny creatures who spoke in musical tones and showed me the secret world that exists beneath our notice.",

  "I was in a magical forest where the trees had faces and could talk. They shared ancient wisdom about the cycles of life and death, growth and decay. As night fell, the trees' leaves began to glow like lanterns, lighting up pathways I had never seen before.",
  
  "I found myself in my workplace, but it had transformed into a mystical castle. My colleagues were all wearing medieval robes, and we were working on projects involving potions and spell books instead of computers. The elevator had become a spiral staircase that seemed to go on forever.",
  
  "I was driving a car that could fly, soaring above city streets and highways. The feeling of freedom was incredible as I navigated between skyscrapers and through clouds. Other flying cars passed by, and their drivers waved as if this was completely normal.",
];

const sampleSymbols = [
  'water', 'flying', 'house', 'family', 'animals', 'ocean', 'forest', 'car', 'school', 'work',
  'friends', 'death', 'fire', 'mountains', 'books', 'music', 'food', 'flowers', 'sun', 'moon',
  'stars', 'bridge', 'door', 'mirror', 'keys', 'phone', 'money', 'clothes', 'baby', 'wedding'
];

const emotionData: { name: string; category: EmotionCategory; intensity: number }[] = [
  { name: 'Happy', category: 'joy', intensity: 8 },
  { name: 'Excited', category: 'joy', intensity: 9 },
  { name: 'Peaceful', category: 'joy', intensity: 7 },
  { name: 'Grateful', category: 'joy', intensity: 6 },
  { name: 'Scared', category: 'fear', intensity: 8 },
  { name: 'Anxious', category: 'fear', intensity: 7 },
  { name: 'Worried', category: 'fear', intensity: 6 },
  { name: 'Terrified', category: 'fear', intensity: 9 },
  { name: 'Sad', category: 'sadness', intensity: 7 },
  { name: 'Lonely', category: 'sadness', intensity: 6 },
  { name: 'Melancholy', category: 'sadness', intensity: 5 },
  { name: 'Grief', category: 'sadness', intensity: 8 },
  { name: 'Angry', category: 'anger', intensity: 8 },
  { name: 'Frustrated', category: 'anger', intensity: 6 },
  { name: 'Irritated', category: 'anger', intensity: 5 },
  { name: 'Surprised', category: 'surprise', intensity: 7 },
  { name: 'Amazed', category: 'surprise', intensity: 8 },
  { name: 'Bewildered', category: 'surprise', intensity: 6 },
  { name: 'Trusting', category: 'trust', intensity: 7 },
  { name: 'Safe', category: 'trust', intensity: 8 },
];

const lifeTags = [
  'work-stress', 'relationship', 'family', 'health', 'creativity', 
  'travel', 'anxiety', 'change', 'growth', 'healing',
  'career', 'friendship', 'home', 'spirituality', 'learning'
];

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const getRandomElements = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomDate = (daysBack: number): Date => {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * daysBack);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Set random hour between 6 AM and 10 AM (typical dream recording time)
  date.setHours(getRandomInt(6, 10));
  date.setMinutes(getRandomInt(0, 59));
  
  return date;
};

const extractSymbolsFromText = (text: string): string[] => {
  const foundSymbols: string[] = [];
  const lowerText = text.toLowerCase();
  
  sampleSymbols.forEach(symbol => {
    if (lowerText.includes(symbol) || lowerText.includes(symbol + 's')) {
      foundSymbols.push(symbol);
    }
  });
  
  // Add some random symbols to make it more interesting
  const additionalSymbols = getRandomElements(
    sampleSymbols.filter(s => !foundSymbols.includes(s)), 
    getRandomInt(0, 3)
  );
  
  return [...foundSymbols, ...additionalSymbols];
};

const generateDreamTitle = (narrative: string): string => {
  const words = narrative.split(' ').slice(0, getRandomInt(2, 5));
  let title = words.join(' ').replace(/[.,!?]/g, '');
  
  // Add some variety to titles
  const titlePrefixes = ['Dream of', 'The', 'My', 'A Strange', 'Vivid', 'Mysterious'];
  
  if (Math.random() > 0.6) {
    const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
    title = `${prefix} ${title}`;
  }
  
  return title.length > 40 ? title.substring(0, 37) + '...' : title;
};

export const generateSampleDream = (customDate?: Date): DreamEntry => {
  const narrative = sampleDreamNarratives[Math.floor(Math.random() * sampleDreamNarratives.length)];
  const dreamDate = customDate || getRandomDate(90); // Last 90 days
  
  // Generate emotions (1-4 emotions per dream)
  const dreamEmotions: Emotion[] = getRandomElements(emotionData, getRandomInt(1, 4)).map(emotion => ({
    id: generateId(),
    name: emotion.name,
    category: emotion.category,
    intensity: emotion.intensity + getRandomInt(-2, 2), // Add some variation
  }));
  
  // Extract and add symbols
  const dreamSymbols = extractSymbolsFromText(narrative);
  
  // Add life tags (0-3 tags per dream)
  const dreamLifeTags = getRandomElements(lifeTags, getRandomInt(0, 3));
  
  return {
    id: generateId(),
    title: generateDreamTitle(narrative),
    narrative: narrative,
    date: dreamDate,
    wakeUpTime: new Date(dreamDate.getTime() + getRandomInt(0, 30) * 60000), // Within 30 minutes
    emotions: dreamEmotions,
    symbols: dreamSymbols,
    lucidity: getRandomInt(1, 10),
    vividness: getRandomInt(3, 10), // Dreams are usually quite vivid
    sleepQuality: getRandomInt(4, 10),
    sleepDuration: getRandomInt(360, 540), // 6-9 hours in minutes
    lifeTags: dreamLifeTags,
    status: Math.random() > 0.2 ? 'complete' : 'draft', // 80% complete, 20% draft
    voiceRecordingUri: Math.random() > 0.7 ? 'sample://voice-recording' : undefined, // 30% have voice notes
    patterns: [],
    createdAt: dreamDate,
    updatedAt: dreamDate,
  };
};

export const generateMultipleSampleDreams = (count: number): DreamEntry[] => {
  const dreams: DreamEntry[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    // Spread dreams across the last 90 days, with more recent dreams
    const daysBack = Math.floor(Math.random() * Math.random() * 90); // Weighted toward recent days
    const dreamDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    dreams.push(generateSampleDream(dreamDate));
  }
  
  // Sort dreams by date (newest first)
  return dreams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const sampleDreamTitles = [
  "Flying Over the Ocean",
  "The Childhood Home Mystery",
  "Library of Living Stories",
  "The Endless Exam Chase",
  "Underwater Coral City",
  "Magical Voice on Stage",
  "Desert of Colored Moons",
  "Dinner with Lost Ones",
  "The Parallel Door",
  "Adventures in Miniature",
  "Talking Trees Wisdom",
  "Medieval Office Castle",
  "Flying Car Freedom"
];

// Function to add sample data to existing store
export const addSampleData = (existingDreams: DreamEntry[], sampleCount: number = 15): DreamEntry[] => {
  if (existingDreams.length > 0) {
    // Don't add sample data if user already has dreams
    return existingDreams;
  }
  
  const sampleDreams = generateMultipleSampleDreams(sampleCount);
  return sampleDreams;
};