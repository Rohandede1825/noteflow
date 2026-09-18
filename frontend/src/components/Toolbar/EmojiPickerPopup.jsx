import React, { useState, useEffect, useRef } from 'react';
import { useToolStore } from '../../store/useToolStore';
import { useNotebookStore } from '../../store/useNotebookStore';
import { useUIStore } from '../../store/useUIStore';
import { Search, Smile, Users, Cat, Utensils, Trophy, Plane, Lightbulb, Heart, Flag, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
      '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
      '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀'
    ]
  },
  {
    id: 'people',
    name: 'People',
    icon: Users,
    emojis: [
      '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎',
      '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
      '✍', '💅', '🤳', '💪', '🦾', '🧠', '👀', '👁', '👶', '👧',
      '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮', '🕵️'
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    icon: Cat,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
      '🐌', '🐞', '🐜', '🦟', '🐢', '🐍', '🦎', '🐙', '🦑', '🦐',
      '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊'
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: Utensils,
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🥬',
      '🥒', '🌶', '🌽', '🥕', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨',
      '🧀', '🥚', '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭',
      '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🍿', '🍣'
    ]
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: Trophy,
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁',
      '🏹', '🎣', '🤿', '🥊', '🥋', '🛹', '🛼', '🛷', '⛸', '🥌',
      '🎿', '⛷', '🏂', '🎯', '🎮', '🕹', '🎲', '🧩', '🎨', '🎬'
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: Plane,
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🛵', '🏍', '🛺', '🚲', '🛴', '🚨',
      '🚂', '🚆', '🚄', '🚅', '🚀', '🛸', '🚁', '✈️', '⛵', '🚢',
      '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🏝', '🏖', '🌋'
    ]
  },
  {
    id: 'objects',
    name: 'Objects',
    icon: Lightbulb,
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '📷', '📹',
      '🎥', '📽', '📞', '☎️', '📻', '🎙', '💡', '🔦', '🕯', '🪔',
      '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📝', '✏️',
      '✒️', '🖋', '🖊', '📐', '📏', '📎', '📌', '📍', '🔒', '🔑'
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐️',
      '🌟', '💫', '⚡️', '☄️', '💥', '🔥', '🌈', '☀️', '⛅️', '☁️',
      '❄️', '☃️', '⛄️', '💨', '💧', '💦', '☂️', '☔️', '❌', '⭕️',
      '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '✅'
    ]
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: Flag,
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇸', '🇬🇧',
      '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳',
      '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦', '🇸🇦', '🇦🇪', '🇳🇱', '🇸🇪', '🇳🇴', '🇨🇭'
    ]
  }
];

export function EmojiPickerPopup() {
  const { activePopup, closePopup } = useToolStore();
  const { currentPage, currentPageIndex, setPageElements } = useNotebookStore();
  const { addToast } = useUIStore();
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const popupRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        if (!e.target.closest('[data-emoji-btn]')) {
          closePopup();
        }
      }
    };
    if (activePopup === 'emojiPicker') {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePopup, closePopup]);

  if (activePopup !== 'emojiPicker') return null;

  const currentCatObj = EMOJI_CATEGORIES.find(c => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  const filteredEmojis = searchQuery.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis)
    : currentCatObj.emojis;

  const handleSelectEmoji = (emoji) => {
    if (!currentPage) return;
    const newEmojiElement = {
      id: 'elem-emoji-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      type: 'emoji',
      emoji: emoji,
      x: 240,
      y: 240,
      fontSize: 54,
      width_box: 64,
      height_box: 64
    };

    setPageElements(currentPageIndex, prev => [...prev, newEmojiElement], true);
    addToast(`Added emoji ${emoji}`, 'success');
    closePopup();
  };

  return (
    <div
      ref={popupRef}
      className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-80 max-w-[92vw] bg-[#1e2126]/95 backdrop-blur-xl border border-neutral-700/80 rounded-2xl shadow-floating p-3.5 flex flex-col gap-3 text-neutral-200 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header & Search */}
      <div className="flex items-center gap-2 bg-neutral-900/90 rounded-xl px-2.5 py-1.5 border border-neutral-800">
        <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="p-0.5 hover:text-white text-neutral-400">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 border-b border-neutral-800 scrollbar-none">
          {EMOJI_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`p-1.5 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={cat.name}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emojis Grid */}
      <div className="grid grid-cols-7 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index + '-' + emoji}
            onClick={() => handleSelectEmoji(emoji)}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/15 active:scale-90 transition-all text-xl hover:scale-110"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
