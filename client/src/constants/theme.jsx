export const ANSWER_SHAPES = [
  {
    index: 0,
    name: 'triangle',
    label: 'Segitiga',
    color: '#E21B3C',
    bgClass: 'bg-[#E21B3C]',
    hoverClass: 'hover:bg-[#c81533]',
    activeClass: 'active:bg-[#ad112b]',
    svg: (
      <svg viewBox="0 0 100 100" className="w-8 h-8 fill-white">
        <polygon points="50,15 90,85 10,85" />
      </svg>
    )
  },
  {
    index: 1,
    name: 'diamond',
    label: 'Wajik',
    color: '#1368CE',
    bgClass: 'bg-[#1368CE]',
    hoverClass: 'hover:bg-[#105ab4]',
    activeClass: 'active:bg-[#0c478f]',
    svg: (
      <svg viewBox="0 0 100 100" className="w-8 h-8 fill-white">
        <polygon points="50,10 90,50 50,90 10,50" />
      </svg>
    )
  },
  {
    index: 2,
    name: 'circle',
    label: 'Lingkaran',
    color: '#D89E00',
    bgClass: 'bg-[#D89E00]',
    hoverClass: 'hover:bg-[#bc8900]',
    activeClass: 'active:bg-[#9e7300]',
    svg: (
      <svg viewBox="0 0 100 100" className="w-8 h-8 fill-white">
        <circle cx="50" cy="50" r="40" />
      </svg>
    )
  },
  {
    index: 3,
    name: 'square',
    label: 'Kotak',
    color: '#26890C',
    bgClass: 'bg-[#26890C]',
    hoverClass: 'hover:bg-[#1f7309]',
    activeClass: 'active:bg-[#185c07]',
    svg: (
      <svg viewBox="0 0 100 100" className="w-8 h-8 fill-white">
        <rect x="15" y="15" width="70" height="70" rx="6" />
      </svg>
    )
  }
];

export const LOBBY_TRACKS = [
  { id: 'classic', name: 'Klasik Kahoot 🎶', file: '/audio/lobby.mp3' },
  { id: '8bit', name: '8-Bit Retro Game 🕹️', file: '/audio/lobby_8bit.mp3' },
  { id: 'disco', name: 'Disco Groovy 🪩', file: '/audio/lobby_disco.mp3' },
  { id: 'funk', name: 'Funk & Soul 🎸', file: '/audio/lobby_funk.mp3' },
  { id: 'reggae', name: 'Reggae Chill 🌴', file: '/audio/lobby_reggae.mp3' },
];

const ADJECTIVES = ['Lincah', 'Santai', 'Jenius', 'Cerdas', 'Gemas', 'Perkasa', 'Kilat', 'Hebat', 'Super', 'Juara', 'Keren', 'Pemberani', 'Bijak', 'Ceria'];
const ANIMALS = ['Kucing', 'Kelinci', 'Panda', 'Singa', 'Garuda', 'Bebek', 'Koala', 'Harimau', 'Lumba2', 'Cheetah', 'Rubah', 'Serigala'];

export function generateRandomNickname() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const anim = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 90 + 10);
  return `${anim} ${adj} ${num}`;
}
