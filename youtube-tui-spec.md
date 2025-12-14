# 🎵 YouTube TUI Player – Full Implementation Plan (AI-IDE Prompt)

This document is a **complete, unambiguous implementation plan** intended to be pasted directly into an AI IDE (Cursor, Windsurf, Claude Code, etc.) to generate the **entire application** exactly as specified.

The goal is a **YouTube-like terminal UI (TUI)** music player built with **Ink (React for CLI)**, featuring search, ASCII thumbnails, playlists, autoplay, and loop — **without AI features**.

---

## 1. High-Level Goal

Build a **full-screen interactive CLI application** that allows users to:

- Search YouTube
- Browse results with metadata
- Select and play videos or playlists
- Control playback with keyboard
- View progress, autoplay, and loop states
- Navigate between screens like a real app

The CLI should feel like a **real product**, not a script.

---

## 2. Core Constraints & Principles

- **No AI features**
- **Keyboard-only**
- **Full-screen Ink TUI**
- **mpv handles playback**
- **Search uses YouTube metadata APIs (yt-search / ytsr)**
- **Clear separation of UI, data, and playback**
- **Deterministic navigation and state machine**

---

## 3. Technology Stack (MANDATORY)

### Runtime
- Node.js 20+
- TypeScript

### UI
- `ink`
- `ink-text-input`
- `chalk`
- `ansi-escapes`

### YouTube Metadata
- `yt-search` (preferred) or `ytsr`

### Playback
- `mpv` (external dependency)
- Control via IPC (`--input-ipc-server`)

### Utilities
- `execa`
- `zustand` OR reducer-based state

---

## 4. Application Screens (STRICT)

The app MUST implement exactly these 3 screens.

---

## Screen 1: Home / Search Screen

### UI Layout

```
████████████████████████████
████   Y O U T U B E   ████
████████████████████████████

🔍 Search YouTube
> lofi hip hop beats
```

### Behavior

- Cursor starts in search input
- User types text
- `Enter`:
  - If input starts with `https://` → route directly to **Player Screen**
  - Else → perform YouTube search
- `Ctrl+C` → exit app

### Notes

- Logo is static ASCII art
- Input is controlled
- Simple URL detection (`startsWith("http")`)

---

## Screen 2: Search Results Screen

### UI Layout (YouTube-style)

```
> Lofi hip hop beats to relax
  Chillhop Music

  Late night coding mix
  Study Session
```

### Requirements

- Vertical list
- Right column:
  - Title (bold)
  - Channel name (dim)
- Highlight selected item
- Scroll if overflow

### Controls

| Key | Action |
|---|---|
| ↑ / ↓ | Navigate |
| Enter | Select video |
| Esc | Back to Search |
| q | Quit |

---

## Screen 3: Player Screen

### UI Layout

```
                     Lofi hip hop beats to relax
                     Chillhop Music

▶━━━━━━━⚪────────── 02:14 / 01:02:30

[ Space ] Play / Pause
[ N ] Next    [ P ] Prev
[ A ] Autoplay: ON
[ L ] Loop: OFF
[ Esc ] Back
```

### State

```ts
{
  playing: boolean
  progress: number
  duration: number
  autoplay: boolean
  loop: boolean
  queue: Video[]
  currentIndex: number
}
```

### Playback Rules

```
onTrackEnd:
  if loop → replay same
  else if autoplay → play next
  else → stop and wait
```

### Controls

| Key | Action |
|---|---|
| Space | Play / Pause |
| N | Next |
| P | Previous |
| A | Toggle autoplay |
| L | Toggle loop |
| Esc | Back to results |

---

## 5. Navigation State Machine (REQUIRED)

```txt
HOME
 └─(search)→ RESULTS
RESULTS
 ├─(enter)→ PLAYER
 └─(esc)→ HOME
PLAYER
 ├─(esc)→ RESULTS
 ├─(next)→ PLAYER
 └─(prev)→ PLAYER
```

No implicit transitions.

---

## 6. Search & Playlist Handling

### Search

- Use `yt-search` to fetch:
  - videoId
  - title
  - author
  - duration
- Limit to 10–15 results

### Playlist

- If URL is playlist:
  - Extract list of video URLs
  - Populate queue
  - Start at index 0

---

## 7. Playback Controller (mpv)

### mpv Requirements

- Spawn mpv once
- Use IPC socket
- Commands:
  - loadfile
  - pause
  - seek
  - observe_property (time-pos, duration)

### CLI NEVER decodes audio itself.

---

## 8. Project Structure (MANDATORY)

```
src/
 ├─ app.tsx
 ├─ router/
 │   └─ screen.ts
 ├─ screens/
 │   ├─ Home.tsx
 │   ├─ Results.tsx
 │   └─ Player.tsx
 ├─ store/
 │   └─ playerStore.ts
 ├─ yt/
 │   ├─ search.ts
 │   ├─ playlist.ts
 ├─ player/
 │   └─ mpv.ts
 └─ ui/
     └─ ProgressBar.tsx
```

---

## 9. Non-Goals (DO NOT IMPLEMENT)

- No AI / LLM
- No mouse
- No downloads
- No lyrics
- No user accounts
- No config files (v1)

---

## 10. Acceptance Criteria

The app is correct ONLY IF:

- All 3 screens exist and match behavior
- Keyboard navigation works exactly as specified
- mpv plays audio reliably
- Autoplay & loop behave correctly
- ESC always navigates back
- App feels like a real YouTube TUI


---

End of spec.
