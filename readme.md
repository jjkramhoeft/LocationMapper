# Location Tracker Map

A personal map of the places you care about: where you've lived, vacations, jobs, friends, places you want to go. Single user, no accounts, no server. It does **not** track your live GPS position; "tracker" means keeping track of places.

## Running it

```bash
npm install
npm run dev        # dev server on http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # typecheck + production build to dist/
```

Stack: Vite, React, TypeScript, Leaflet via react-leaflet, Lucide icons, Vitest.

## Deploying

Hosted on GitHub Pages at <https://jjkramhoeft.github.io/LocationMapper/> from [jjkramhoeft/LocationMapper](https://github.com/jjkramhoeft/LocationMapper).

- Every push to `main` runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which runs tests, builds, and publishes `dist/`.
- One-time setup: in the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.
- The build uses relative paths (`base: './'`), so the repo name isn't hardcoded. The app has no client-side routes. If a router is ever added, use hash routing, because Pages has no SPA fallback.
- Everything runs in the browser. Your data never reaches GitHub.

## Map

- Flat Leaflet map (Web Mercator) of the whole world; panning wraps around horizontally. No 3D globe.
- Selectable background map (top right), all free and keyless:
  - OpenStreetMap
  - Light gray / Dark gray (Esri canvas)
  - Satellite (Esri World Imagery)
  - OpenTopoMap

  CARTO's light/dark maps were the original plan, but they now require an API key, so Esri's canvas maps replace them.
- **Google** (roadmap and satellite) is optional and only appears once you paste your own API key under Settings. It uses Google's **Map Tiles API** (2D tiles), the supported way to show Google tiles outside Google's own map library. The key needs that API enabled and a billing account. The key is checked when saved, stored in browser storage only, and never put in source or exported JSON. Other pages on the same `github.io` origin can read that storage, so restrict the key in Google Cloud to the Pages URL and to the Map Tiles API.
- Remembers the last view (center/zoom) and background map per device. First run shows the whole world.
- **Fit all** zooms to all visible pins. On a phone it collapses the bottom sheet first, because a world-wide view can't fit above it.
- Pins cluster when crowded. A cluster's ring shows the colors of the pins inside it.

## Groups

- User-defined: create, rename, recolor, change icon, delete.
- Each group has a default **color** and **icon** that its places inherit.
- Starter groups on first run:

  | Group     | Color  | Icon        |
  |-----------|--------|-------------|
  | Lived     | blue   | `house`     |
  | Vacations | orange | `plane`     |
  | Job       | slate  | `briefcase` |
  | Friends   | green  | `users`     |
  | Wish list | purple | `star`      |
  | Other     | gray   | `map-pin`   |

- **Other** is the fallback group: it can be renamed but not deleted.
- Deleting a group that still has places asks where to move them (default: Other). Places are never silently deleted with their group.
- **Delete all places** (in *Edit group*) deletes every place in that group but keeps the group, e.g. to clear out the sample data. It asks first, and the toast offers *Undo*.

## Places

A place (a location on the map) has:

| Field                 | Notes |
|-----------------------|-------|
| `title`               | Required. Pre-filled from the city name when adding. |
| `lat`, `lng`          | The source of truth for position. |
| `address`             | Editable text label (address/city). Pre-filled by reverse geocoding, never re-geocoded behind your back. |
| `groupId`             | Exactly one group. |
| `note`                | Optional plain text. Line breaks kept, URLs auto-linked. |
| `imageUrl`            | Optional, at most one. URLs only, no uploads. |
| `dateFrom`, `dateTo`  | Optional, each end independently. Partial ISO dates: `"2019"`, `"2019-06"`, `"2019-06-14"`. |
| `color`, `icon`       | Optional overrides of the group's defaults. |

- One place has one date range. Revisiting somewhere is a separate place.
- Pin: teardrop marker in the place's color with a white icon from a curated set of about 40 Lucide icons.

## Using the app

- **Add**: press *Add*, then click the map. The pin drops, the address and title are pre-filled via Nominatim, and the edit form opens in the sidebar.
- **Go to** (search box on the map, top left): type an address, city, landmark or country and press Enter. The map zooms and pans to the best match and marks it with a labelled ring. Other matches are listed below the box; pick one to go there instead, or press the pin-plus button next to a match to add a place there. Esc closes the list, a second Esc clears the search and the marker. On a phone the bottom sheet collapses so the result is visible.
  - Uses OpenStreetMap's free [Nominatim](https://nominatim.org/) search, following its usage policy: at most 1 request per second, no search-as-you-type.
  - Countries with far-flung parts (France's overseas territories, the USA's Alaska and Pacific islands) zoom to the main part around Nominatim's point for the place, not to a box spanning the globe.
- **View**: clicking a pin opens a read-only popup with *Edit* and *Delete*.
- **Edit**: the form opens in the sidebar. While editing, drag the pin to move it.
- **Delete**: deletes immediately, with an *Undo* toast.

### Display mode

For showing the map on a screen: **Display** (top right, under Fit all) hides everything except the map and pins.
- Hidden: the sidebar, the map controls, the zoom buttons, toasts, and the Edit/Delete buttons in popups. The tile attribution stays, dimmed, because the map providers require it.
- The browser goes fullscreen where it allows it.
- Leave with **Esc**, by leaving fullscreen, or with the *Exit display* button. That button appears when the mouse moves and fades out, with the cursor, after a few seconds idle.
- Hidden groups stay hidden, so choose what to show before entering.
- Open the app with `?display` (e.g. `https://jjkramhoeft.github.io/LocationMapper/?display`) to start straight in display mode, e.g. from a bookmark on a wall screen. Fullscreen needs a click there, because browsers only allow it after user input.

### Sidebar

- Searchable list of places. Search matches title, address and note. Clicking an entry zooms to the pin.
- Sorted by date, newest first, undated places last. Can switch to sorting by group or by title.
- Group show/hide toggles filter both the map and the list.
- On narrow screens, the sidebar becomes a bottom sheet. Fully usable on a phone, designed for desktop first.

## Persistence

- **Auto-save** to browser storage (per browser and device). Keys are prefixed `ltm:` (e.g. `ltm:data`, `ltm:settings`), because all `<user>.github.io` projects share one origin and therefore one storage.
- **Export / Import JSON** (database icon in the header) for backups and for moving data between devices. Phone and laptop do not sync otherwise. If the saved data in browser storage can't be read, it is kept under `ltm:data-unreadable` instead of being overwritten.
- Import **replaces** the current data, after a confirmation.
- Import is validated before anything is touched:
  - Fatal problems (invalid JSON, missing or unknown `version`, invalid coordinates) reject the whole file with a clear error. Your existing data is left alone.
  - Minor problems are fixed and reported, e.g. places pointing to an unknown group are moved to Other.
  - Never a half import.

### File format

```json
{
  "version": 1,
  "groups": [
    { "id": "lived", "name": "Lived", "color": "#2563eb", "icon": "house" }
  ],
  "places": [
    {
      "id": "0b6c…",
      "groupId": "lived",
      "title": "First flat",
      "lat": 55.6867,
      "lng": 12.5701,
      "address": "Copenhagen, Denmark",
      "note": "Third floor, no elevator.",
      "imageUrl": "https://…",
      "dateFrom": "2005-08",
      "dateTo": "2010"
    }
  ]
}
```

IDs are UUIDs (starter groups use readable ids). Settings (background map, last view, hidden groups, sort order, Google key) are not part of the file.

### Sample data

[public/sample-data.json](public/sample-data.json) holds 15 test places spread across all six groups, worldwide (Copenhagen to McMurdo Station). It covers:
- date ranges, open-ended dates and undated places
- notes with links
- image URLs
- color and icon overrides
- a cluster of nearby pins in Denmark

Load it with **Load sample data**, either from the empty place list or from the import/export menu. It goes through the same check and confirmation as any import, and replaces your current data.

## UI and locale

- English UI.
- Dates are formatted with the browser's locale and only as precise as entered: `"2019"` shows as "2019", and `"2019-06"` shows as "Jun 2019" or "juni 2019".

## Testing

Vitest covers the core logic:
- JSON validation and migration, including that the sample data imports without warnings
- partial-date parsing, formatting and sorting
- the group-delete fallback
- color/icon inheritance
- the place form's checks, URL linkifying in notes, and the data reducer (including undo of a delete)

There are no end-to-end browser tests in v1; the UI is checked by hand.

## Code layout

```
src/
  domain/   types, default groups, icons, pure logic: dates, sorting, validation (+ *.test.ts)
  geo/      Nominatim address lookup and search (rate-limited to 1 request/second)
  map/      Leaflet map, basemaps, Google Map Tiles session, pin and cluster icons
  state/    data reducer, browser-storage persistence
  ui/       sidebar, forms, dialogs, popups, pickers
  App.tsx   wires state, map and sidebar together
public/
  sample-data.json
```

In code, a location is called `Place`, so it can't be confused with the DOM's global `Location` type.

## Deferred (not v1)

- 3D globe view
- Multiple visits per place
- Local photo uploads
- Markdown notes
- Date filter and timeline
- Merge on import
- Save back to the same file (File System Access API, Chrome/Edge)
- Sync between devices
