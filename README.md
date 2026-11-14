# 🪶 FeatherFind

### Discover the birds of Sri Lanka. One sighting at a time.

FeatherFind is a mobile-first field guide for exploring Sri Lanka’s remarkable birdlife. Browse a growing catalogue of **36 species**, learn how to recognize them, identify a bird from a photo, and keep a personal record of what you find in the field.

Built with Expo and React Native, FeatherFind is designed for quick use outdoors and works across Android, iOS, and the web.

---

## ✨ Features

- **Explore the bird catalogue** — Search the local guide by common name, scientific name, Sinhala name, or bird family, with extra bird species from the free iNaturalist search API.
- **Browse by group** — Filter the guide to endemic species or species of conservation concern.
- **Learn about each bird** — Read identification clues, habitat and range information, diet, behavior, and interesting facts.
- **Search more bird species online** — Home and Explore search the public iNaturalist taxonomy API and link to species details.
- **Meet the bird of the day** — Discover a different catalogue species each day and open its details with one tap.
- **Identify a bird from a photo** — Take a picture or choose one from your gallery to get vision-model suggestions, matched with the local bird guide when possible.
- **Record sightings** — Save the bird, date and time, location, number seen, notes, and an optional photo.
- **Use GPS in the field** — Add your current location to a sighting when location permission is available.
- **Keep a personal checklist** — Mark the species you have spotted and track your progress.
- **Save favorite birds** — Keep interesting species close at hand.
- **Make it yours** — Switch between light and dark appearance.
- **Keep your field records on-device** — Sightings, favorites, and checklist data are stored locally with SQLite.

> **Photo identification:** An internet connection and a deployed backend are required. The selected photo is sent to Groq's vision API through the Cloudflare Worker. The Groq API key is stored only as a Cloudflare secret, never in the app.
> **Online bird search** uses iNaturalist's public taxonomy API and does not need an API key.

---

## 🧰 Technology

| Technology | What it does |
| --- | --- |
| [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) | App runtime, device APIs, and cross-platform development |
| [React Native 0.88](https://reactnative.dev/) | Native mobile user interface |
| [Expo Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/) | File-based navigation between app screens |
| [TypeScript](https://www.typescriptlang.org/) | Typed application code |
| [Expo SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/) | Local bird catalogue, sightings, favorites, and checklist |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Local app preferences |
| [Expo Image Picker](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/) | Camera capture and gallery selection |
| [Expo Location](https://docs.expo.dev/versions/v58.0.0/sdk/location/) | Optional GPS location for sightings |
| [iNaturalist API](https://api.inaturalist.org/v1/docs/) | Free public bird taxonomy search |
| [Groq API](https://console.groq.com/docs/vision) | Vision-based bird photo identification |
| [Cloudflare Workers](https://developers.cloudflare.com/workers/) | Secure proxy for Groq API requests |

---

## 🚀 Get started

### Requirements

- [Node.js](https://nodejs.org/) and npm
- A phone with [Expo Go](https://expo.dev/go) for quick device testing, or an Android/iOS development environment
- An internet connection for online bird search
- A Groq API key and a Cloudflare account to enable photo identification

### Install and start

```bash
# Clone the repository and enter the project
git clone https://github.com/vihara02/FeatherFind.git
cd FeatherFind

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

Follow the QR-code instructions in the terminal to open the app on your device with Expo Go. You can also use the Expo development server shortcuts:

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

Camera, gallery, and GPS behavior should be tested on a device with the required permissions enabled. The iOS simulator does not have a physical camera.

### Set up bird photo identification

The mobile app does not contain provider credentials. The Cloudflare Worker sends the selected photo to Groq's `qwen/qwen3.8-27b` vision model. Groq free-tier access and limits are subject to Groq's current plan and model availability.

1. Create a Groq API key in the [Groq Console](https://console.groq.com/keys).
2. Log in to Cloudflare with Wrangler and store the API key as a server secret:

   ```bash
   npx wrangler login
   npx wrangler secret put GROQ_API_KEY
   ```

3. Deploy the proxy:

   ```bash
   npx wrangler deploy
   ```

4. Copy `.env.example` to `.env`, set `EXPO_PUBLIC_BIRD_IDENTIFICATION_API_URL` to the deployed worker URL ending in `/api/identify`, then restart Expo.
5. Open **Identify bird**, take or select a photo, and tap **Identify this bird**.

Keep `GROQ_API_KEY` in Cloudflare secrets only; never put it in `.env`, source control, or the mobile app. The `IDENTIFY_LIMITER` binding in the root `wrangler.toml` is a Cloudflare rate-limit binding, not a secret. The root config points to `backend/worker.ts`, so Cloudflare deploys the request-handling Worker rather than a static-assets-only project.

### Online bird search

Bird-name searches in Home and Explore query iNaturalist's public taxonomy API after a short debounce. No API key, account, or additional configuration is needed. The bundled guide remains available if the network is unavailable.

---

## 🗂️ Project structure

```text
FeatherFind/
├── assets/
│   ├── birds/                 # Bundled bird photographs
│   └── ...                    # App icons and splash assets
├── scripts/
│   └── download_birds.js      # Helper for downloading catalogue images
├── backend/
│   └── worker.ts              # Cloudflare proxy for Groq vision API
├── wrangler.toml              # Cloudflare Worker entry point and bindings
├── src/
│   ├── app/
│   │   ├── _layout.tsx        # Root navigation layout and theme provider
│   │   ├── index.tsx          # Home screen, quick actions, and profile
│   │   ├── explore.tsx        # Searchable and filterable bird guide
│   │   └── identify.tsx       # Photo selection and AI identification
│   ├── components/            # Reusable cards, badges, and search UI
│   ├── constants/             # Theme colors and Sri Lankan habitat data
│   ├── context/                # Theme, preferences, and database contexts
│   ├── data/                   # Bird catalogue and image mappings
│   ├── db/                     # SQLite schema and data repositories
│   ├── services/               # Bird identification, camera, location, and storage
│   └── types/                  # Shared TypeScript types
├── app.json                    # Expo app configuration
├── package.json                # Dependencies and run scripts
└── tsconfig.json               # TypeScript configuration
```

---

## 🐦 Bird catalogue

The catalogue includes Sri Lankan endemic birds alongside other species found on the island. Each entry contains scientific and local names where available, identification characteristics, habitat, distribution, diet, conservation status, and more.

The bundled catalogue is in [`src/data/birdsData.ts`](src/data/birdsData.ts). Bird records are added to the local SQLite database when the app starts, including when an existing installation receives a catalogue update.

---

## 🔐 Privacy and permissions

- Birding records and app preferences are stored locally on the device.
- Camera and photo-library access are requested when you use photo features.
- Location access is optional and used to add GPS coordinates to a sighting.
- Bird searches send the search text to iNaturalist. Review [iNaturalist’s terms](https://www.inaturalist.org/terms) and [privacy policy](https://www.inaturalist.org/privacy).
- Photo identification sends the selected image to Groq through the configured Cloudflare Worker. Review [Groq's terms](https://groq.com/terms-of-use/) and privacy policy before using the feature.
- The Groq API key is stored as a Cloudflare secret, not in the mobile app.

---

## 📄 License

See [`LICENSE`](LICENSE) for project licensing information.
