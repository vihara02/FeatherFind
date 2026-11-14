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
- **Identify a bird from a photo** — Take a picture or choose one from your gallery to get AI-generated identification suggestions and helpful visual clues.
- **Record sightings** — Save the bird, date and time, location, number seen, notes, and an optional photo.
- **Use GPS in the field** — Add your current location to a sighting when location permission is available.
- **Keep a personal checklist** — Mark the species you have spotted and track your progress.
- **Save favorite birds** — Keep interesting species close at hand.
- **Make it yours** — Switch between light and dark appearance and configure your Gemini API key in Profile.
- **Keep your field records on-device** — Sightings, favorites, and checklist data are stored locally with SQLite.

> **Online bird search** uses iNaturalist's public taxonomy API and does not need an API key. Photo identification remains a separate Gemini-powered feature configured in Profile.

---

## 🧰 Technology

| Technology | What it does |
| --- | --- |
| [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/) | App runtime, device APIs, and cross-platform development |
| [React Native 0.88](https://reactnative.dev/) | Native mobile user interface |
| [Expo Router](https://docs.expo.dev/versions/v58.0.0/sdk/router/) | File-based navigation between app screens |
| [TypeScript](https://www.typescriptlang.org/) | Typed application code |
| [Expo SQLite](https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/) | Local bird catalogue, sightings, favorites, and checklist |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Local preferences, including the Gemini API key |
| [Expo Image Picker](https://docs.expo.dev/versions/v58.0.0/sdk/imagepicker/) | Camera capture and gallery selection |
| [Expo Location](https://docs.expo.dev/versions/v58.0.0/sdk/location/) | Optional GPS location for sightings |
| [Google Gemini API](https://ai.google.dev/gemini-api/docs) | AI-assisted bird photo identification |
| [iNaturalist API](https://api.inaturalist.org/v1/docs/) | Free public bird taxonomy search |

---

## 🚀 Get started

### Requirements

- [Node.js](https://nodejs.org/) and npm
- A phone with [Expo Go](https://expo.dev/go) for quick device testing, or an Android/iOS development environment
- An optional Gemini API key for photo identification
- An internet connection for online bird search

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

### Set up AI identification

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open FeatherFind and tap the **Profile** icon.
3. Paste the key into **Gemini API key** and save.
4. Open **Identify bird**, take or select a photo, and tap **Identify this bird**.

The app stores the key in local device preferences. Do not commit API keys to this repository.

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
│   ├── services/               # AI, camera, location, and storage services
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
- Photo identification sends the selected image and prompt to Google Gemini. Review Google’s privacy terms and API settings before using the feature.
- The Gemini API key is stored in local app preferences. A key embedded in a client app should be treated as recoverable; use API restrictions and a secure server-side proxy for production deployments.
- Bird searches send the search text to iNaturalist. Review [iNaturalist’s terms](https://www.inaturalist.org/terms) and [privacy policy](https://www.inaturalist.org/privacy).

---

## 📄 License

See [`LICENSE`](LICENSE) for project licensing information.
