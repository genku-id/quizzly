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
