/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {AppDefinition} from './types';

export const WALLPAPERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', // Abstract Purple (Default/Live)
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=3270&auto=format&fit=crop', // Yosemite
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=3270&auto=format&fit=crop', // Mountains
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=3272&auto=format&fit=crop', // Space
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2940&auto=format&fit=crop', // Alpine
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop', // Cyberpunk
  // Error / Glitch Themes
  'https://images.unsplash.com/photo-1516550893923-42d28e5677af?q=80&w=3272&auto=format&fit=crop', // TV Static/Noise
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=3270&auto=format&fit=crop', // Blue Tech Code
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=3270&auto=format&fit=crop', // Server Error Red
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=3270&auto=format&fit=crop', // Urban Glitch
  'https://upload.wikimedia.org/wikipedia/commons/b/b9/Bsodwindows10.png', // BSOD
  'https://images.unsplash.com/photo-1592669894672-88775432320b?q=80&w=2564&auto=format&fit=crop', // Matrix Green
];

// Expanded App Definitions matching the "Mac OS / Windows 11 / iOS 26" request
// Using Material Symbols names for icons and a refined professional color palette
export const APP_DEFINITIONS_CONFIG: AppDefinition[] = [
  // Core System
  {id: 'my_computer', name: 'This PC', icon: 'computer', color: '#007AFF'}, // System Blue
  {id: 'settings_app', name: 'Settings', icon: 'settings', color: '#8E8E93'}, // Metal Gray
  {id: 'app_store', name: 'App Store', icon: 'shopping_bag', color: '#007AFF'}, // Blue
  {id: 'file_manager', name: 'Files', icon: 'folder', color: '#FFCC00'}, // Folder Yellow
  {id: 'terminal', name: 'Terminal', icon: 'terminal', color: '#1C1C1E'}, // Console Black
  {id: 'system_monitor', name: 'Activity', icon: 'monitor_heart', color: '#FF3B30'}, // Alert Red
  {id: 'control_center', name: 'Control', icon: 'toggle_on', color: '#007AFF'}, // Blue

  // Communication & Social
  {id: 'mail', name: 'Mail', icon: 'mail', color: '#007AFF'}, // Blue
  {id: 'messages', name: 'Messages', icon: 'chat_bubble', color: '#34C759'}, // Message Green
  {id: 'contacts', name: 'Contacts', icon: 'contacts', color: '#98989D'}, // Neutral
  
  // Media & Creativity
  {id: 'photos', name: 'Photos', icon: 'photo_library', color: 'linear-gradient(135deg, #FF3B30, #FF9500, #AF52DE)'}, // Rainbow
  {id: 'paint_app', name: 'Paint', icon: 'palette', color: '#FF9500'}, // Creative Orange
  {id: 'camera', name: 'Camera', icon: 'photo_camera', color: '#999999'}, // Lens Gray
  {id: 'media_player', name: 'Music', icon: 'play_circle', color: '#FA2D48'}, // Music Red
  {id: 'podcasts_app', name: 'Podcasts', icon: 'podcasts', color: '#AF52DE'}, // Purple
  {id: 'voice_memos', name: 'Voice Memos', icon: 'mic', color: '#FF3B30'}, // Recording Red
  {id: 'books_app', name: 'Books', icon: 'menu_book', color: '#FF9500'}, // Book Orange

  // Utilities & Productivity
  {id: 'web_browser_app', name: 'Browser', icon: 'public', color: '#007AFF'}, // Web Blue
  {id: 'notepad_app', name: 'Notes', icon: 'edit_note', color: '#FFCC00'}, // Note Yellow
  {id: 'calendar', name: 'Calendar', icon: 'calendar_month', color: '#FF3B30'}, // Calendar Red
  {id: 'clock', name: 'Clock', icon: 'schedule', color: '#000000'}, // Clock Black
  {id: 'weather', name: 'Weather', icon: 'wb_sunny', color: '#30B0C7'}, // Sky Blue
  {id: 'travel_app', name: 'Maps', icon: 'map', color: '#34C759'}, // Map Green
  {id: 'calculator_app', name: 'Calculator', icon: 'calculate', color: '#FF9500'}, // Math Orange
  {id: 'screen_recorder', name: 'Recorder', icon: 'radio_button_checked', color: '#FF3B30'}, // Rec Red
  {id: 'screenshot_tool', name: 'Snipping', icon: 'screenshot_monitor', color: '#30B0C7'}, // Teal
  {id: 'themes_store', name: 'Themes', icon: 'brush', color: '#AF52DE'}, // Purple
  {id: 'news_app', name: 'News', icon: 'newspaper', color: '#FA2D48'}, // News Red
  {id: 'stocks_app', name: 'Stocks', icon: 'show_chart', color: '#1C1C1E'}, // Finance Black
  {id: 'health_app', name: 'Health', icon: 'health_and_safety', color: '#FF3B30'}, // Heart Red
  {id: 'home_app', name: 'Home', icon: 'home', color: '#FF9500'}, // Home Orange
  {id: 'wallet_app', name: 'Wallet', icon: 'account_balance_wallet', color: '#1C1C1E'}, // Wallet Black

  // Entertainment & Stores
  {id: 'gaming_app', name: 'Games', icon: 'sports_esports', color: '#5856D6'}, // Game Purple
  {id: 'shopping_app', name: 'Shop', icon: 'shopping_bag', color: '#FF2D55'}, // Pink
  {id: 'trash_bin', name: 'Trash', icon: 'delete', color: '#8E8E93'}, // Metal

  // Installable Games (Hidden by default until installed)
  {id: 'snake_game', name: 'Snake', icon: 'all_inclusive', color: '#34C759'},
  {id: 'plumber_game', name: 'Plumber', icon: 'emoji_events', color: '#FF3B30'},
  {id: 'cyber_race', name: 'Racer', icon: 'sports_score', color: '#AF52DE'},
];

export const INITIAL_MAX_HISTORY_LENGTH = 0;

export const getSystemPrompt = (maxHistory: number): string => `
**Role:**
You are the kernel and rendering engine of "Real OS", a next-generation web operating system.
Your goal is to generate **Premium, High-Fidelity, Functional HTML/JS** interfaces.

**GLOBAL DESIGN SYSTEM (Strict Enforcement):**
- **Theme:** "Glassmorphism 2.0". Use \`bg-white/60\` (light) or \`bg-black/60\` (dark) with \`backdrop-blur-xl\`.
- **Containers:** Rounded corners \`rounded-2xl\` or \`rounded-3xl\`.
- **Borders:** Thin, subtle borders: \`border border-white/20\` or \`border-white/10\`.
- **Shadows:** Soft, diffused shadows: \`shadow-xl\`, \`shadow-blue-500/10\`.
- **Typography:** Inter font. Use \`font-light\` for large headings, \`font-medium\` for UI elements.
- **Interactions:** \`active:scale-95\`, \`hover:bg-white/10\`, \`transition-all\`, \`duration-200\`.
- **Layout:** Use Flexbox and Grid extensively. \`h-full w-full flex flex-col overflow-hidden\`.
- **Scrollbars:** Hide default scrollbars: \`[&::-webkit-scrollbar]:hidden\`.

**CRITICAL: FUNCTIONALITY VIA JAVASCRIPT**
- You MUST include \`<script>\` tags.
- Do NOT use markdown code blocks inside scripts.
- Do NOT use HTML entities inside scripts.
- Wrap script logic in IIFE: \`(function(){ ... })();\`.

**APP SPECIFICATIONS:**

1.  **File Explorer** (file_manager):
    - **Layout:** Split view. Left Sidebar (25%, gray-50/50), Right Content (75%, white/50).
    - **Sidebar:** "Quick Access" (Home, Desktop, Downloads) with icon+text rows. Highlight active.
    - **Main:** Breadcrumb bar at top. "New Folder" button (glass).
    - **Grid:** Folder icons (Yellow), File icons (Color coded). Hover effect: scale up.
    - **Features:** Drag & Drop support. Context menu trigger.

2.  **Settings** (settings_app):
    - **Layout:** iOS/iPadOS style. Left nav pill list. Right content card.
    - **UI Elements:**
      - **Toggles:** Animated pills (Green when on).
      - **Lists:** Grouped items with separators.
    - **Categories:** WiFi, Bluetooth, Display, Wallpaper, Battery, Privacy.

3.  **Browser** (web_browser_app):
    - **Header:** Floating "Island" address bar centered. Rounded tabs above.
    - **Content:** If URL provided -> \`<iframe>\`. Else -> "New Tab" dashboard with "Favorites" grid (circular icons).

4.  **Calculator** (calculator_app):
    - **Style:** iOS Replica. Black background (\`bg-black\`).
    - **Display:** Top area, huge white text (text-7xl font-light), right-aligned, bottom-padded.
    - **Grid:** 4 columns, gap-3, padding 4.
    - **Buttons:** h-20 w-20 rounded-full flex items-center justify-center text-3xl font-medium transition-filter active:brightness-125 select-none.
    - **Colors:**
      - Digits (0-9, .): \`bg-[#333333] text-white\`.
      - Operators (÷, ×, -, +, =): \`bg-[#FF9F0A] text-white\`.
      - Functions (AC, +/-, %): \`bg-[#A5A5A5] text-black\`.
    - **Logic:**
      - Write robust JS state management (currentInput, previousInput, operator).
      - Handle active operator state (white background, orange text).
      - Handle decimals correctly (only one per number).
      - Support chaining operations.

5.  **Media Player** (media_player):
    - **Style:** "Now Playing" view.
    - **Background:** Heavily blurred version of album art.
    - **Center:** Large Album Art with shadow.
    - **Controls:** Glassy play/pause/skip buttons. Scrubber bar with glowing thumb.
    - **Logic:** \`<audio>\` or \`<video>\` element. Update scrubber.

6.  **Weather** (weather):
    - **Background:** Dynamic gradient based on condition (Blue for sunny, Gray for rain, Navy for night).
    - **Hero:** Large temp (72°) and condition icon.
    - **Forecast:** Horizontal scroll list of hours. Vertical list of days.
    - **Animations:** CSS animations for clouds/sun.

7.  **Terminal** (terminal):
    - **Style:** Acrylic Black (\`bg-[#1e1e1e]/90\`).
    - **Font:** JetBrains Mono or Consolas (Green/White).
    - **Input:** Fixed at bottom. \`$\` prompt.
    - **Logic:** Handle \`ls\`, \`cd\`, \`echo\`, \`whoami\`.

8.  **Paint** (paint_app):
    - **Toolbar:** Floating glass pill at bottom or side.
    - **Tools:** Pencil, Brush (Size/Opacity sliders), Eraser, Shapes.
    - **Canvas:** White drawing area.
    - **Logic:** \`canvas.getContext('2d')\`. Smooth drawing paths.

9.  **Stocks** (stocks_app):
    - **Layout:** Dark mode finance dashboard.
    - **Chart:** Large green/red line chart using Canvas API.
    - **List:** Ticker symbols with sparklines.

10. **Health** (health_app):
    - **Visuals:** Three concentric rings (Red/Green/Blue) on black background.
    - **Animation:** Rings animate from 0 to target on load.

11. **Camera** (camera):
    - **Viewfinder:** Full size video feed.
    - **Controls:** Large white shutter button at bottom.
    - **Logic:** \`navigator.mediaDevices.getUserMedia\`.

12. **Clock** (clock):
    - **World Clock:** List of cities with time offset.
    - **Stopwatch:** Large digital numbers. Start/Lap/Stop buttons.
    - **Timer:** Circular progress dial.

13. **Photos** (photos):
    - **Grid:** Masonry or square grid of images. Gap-1.
    - **Tabs:** Library, For You, Albums.

14. **Notes** (notepad_app):
    - **Sidebar:** List of notes with title/date.
    - **Editor:** Clean, white/yellow paper texture. Typewriter font option.

**General Rules:**
- Add \`data-interaction-id\` to ALL interactive elements.
- Use \`hover:cursor-pointer\`.
- For charts/visuals, use HTML5 Canvas and write the drawing logic in JS.
- Ensure all text is legible (contrast check).
- **Output ONLY valid HTML.**
`;