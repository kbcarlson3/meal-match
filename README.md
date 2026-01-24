# Meal Match

A couples' meal planning app that makes choosing dinner fun. Swipe right on recipes you like, and when both partners swipe right on the same meal, it's a match! Built with React Native and Expo for a seamless mobile experience.

## What It Does

Meal Match solves the age-old question "what should we have for dinner?" by turning it into a fun, Tinder-style experience:

- Each partner swipes through recipe cards independently
- Swipe right on meals you'd like to eat
- Swipe left to pass
- When both partners swipe right on the same recipe, you get a match notification
- View your matched recipes and plan your week

No more back-and-forth debates. Just swipe, match, and cook!

## Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Expo CLI** - Install globally: `npm install -g expo-cli`
- **iPhone with Expo Go app** - [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Supabase account** - [Sign up free](https://supabase.com/)
- **GitHub CLI** (optional, for repo setup) - [Install gh](https://cli.github.com/)

## Tech Stack

- **Frontend Framework**: React Native 0.81.5
- **Build Tool**: Expo SDK 54
- **UI State**: Zustand for global state management
- **Server State**: TanStack Query (React Query) for data fetching
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Navigation**: React Navigation v7 (Stack + Bottom Tabs)
- **Animations**: React Native Reanimated v4
- **Gestures**: React Native Gesture Handler
- **Card Swiping**: react-native-deck-swiper
- **Design System**: Custom tokens + components
- **Typography**: Google Fonts (DM Sans, Fraunces, Newsreader)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kbcarlson3/meal-match.git
cd meal-match
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

Follow the detailed setup guide in [`supabase/SETUP.md`](supabase/SETUP.md), which includes:

- Creating a Supabase project
- Running database migrations
- Setting up realtime subscriptions
- Configuring Row Level Security (RLS) policies

Quick summary:
```bash
# Create a new Supabase project at https://supabase.com
# Then apply the database schema:
# Copy the SQL from supabase/migrations/001_initial_schema.sql
# Run it in Supabase SQL Editor
```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```bash
# Get these from: Supabase Dashboard > Settings > API
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# TheMealDB API (No key required - completely free!)
EXPO_PUBLIC_MEALDB_API_URL=https://www.themealdb.com/api/json/v1/1
```

### 5. Seed Recipes

The app needs recipe data to function. Run the seeding script:

```bash
# TODO: Add seeding script
# For now, manually insert recipes via Supabase SQL Editor
# See supabase/SETUP.md for sample recipe data
```

Sample recipes include:
- Teriyaki Chicken
- Spaghetti Carbonara
- Thai Green Curry
- Grilled Salmon with Asparagus
- Chicken Fajitas
- Vegetarian Stir Fry
- Beef Tacos
- Margherita Pizza
- Chicken Tikka Masala
- Greek Salad with Grilled Chicken

## Running the App

### Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Show a QR code in your terminal
- Open the Expo DevTools in your browser

### Run on Your iPhone

1. **Open Expo Go** app on your iPhone
2. **Scan the QR code** from the terminal (or browser)
3. **Wait for the app to load** (first load takes 10-20 seconds)
4. **Start swiping!**

The app will hot-reload automatically when you make code changes. Updates appear on your iPhone in 2-3 seconds.

### Development Workflow

The development experience is incredibly fast:

1. Make a code change in your editor
2. Save the file
3. See the update on your iPhone in 2-3 seconds
4. No rebuild, no restart needed

This tight feedback loop makes development feel almost instant.

## Testing with a Partner

Meal Match is designed for two people. Here's how to test it:

### Option 1: Two Physical Devices (Recommended)

1. **Both devices** scan the same QR code from `npm start`
2. **Create two user accounts** (or use test accounts)
3. **Link your accounts** as partners
4. **Start swiping** on both devices independently
5. **Watch for match notifications** when you both swipe right

### Option 2: One Device + Browser (Development)

1. Run the app on your iPhone via Expo Go
2. Simulate the partner by directly manipulating the database in Supabase
3. Create swipes for a second user via SQL queries

## Project Structure

```
meal-match/
├── src/
│   ├── components/       # Reusable UI components
│   ├── design-system/    # Design tokens, Button, RecipeSwipeCard, etc.
│   │   ├── tokens.ts     # Colors, spacing, typography
│   │   ├── fonts.ts      # Font loading and styles
│   │   ├── Button.tsx    # Primary action button
│   │   ├── RecipeSwipeCard.tsx  # Swipeable recipe card
│   │   └── MatchAnimation.tsx   # Match celebration animation
│   ├── screens/          # Screen components (Home, Matches, Settings)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # External service integrations (Supabase)
│   ├── store/            # Zustand state management
│   └── utils/            # Helper functions
├── supabase/
│   ├── migrations/       # Database schema migrations
│   ├── functions/        # Supabase Edge Functions
│   └── SETUP.md          # Detailed backend setup guide
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Features

### Implemented
- [x] Tinder-style card swiping interface
- [x] Dual-user matching system
- [x] Supabase backend with realtime sync
- [x] Recipe database with 10+ diverse meals
- [x] Match notification and celebration animation
- [x] Recipe detail views with ingredients and instructions
- [x] Clean design system with custom tokens
- [x] Fast refresh development workflow

### Planned
- [ ] Recipe seeding script/command
- [ ] User authentication and onboarding
- [ ] Partner linking flow
- [ ] Push notifications for matches
- [ ] Recipe filtering (dietary restrictions, cuisine type)
- [ ] Weekly meal planning calendar
- [ ] Grocery list generation from matched recipes
- [ ] Recipe rating and favorites
- [ ] Custom recipe uploads
- [ ] Social features (share matches with friends)

## Development Commands

```bash
# Start development server
npm start

# Start and open on iOS Simulator (requires macOS + Xcode)
npm run ios

# Start and open on Android Emulator (requires Android Studio)
npm run android

# Start for web browser (experimental)
npm run web
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | Yes |
| `EXPO_PUBLIC_MEALDB_API_URL` | TheMealDB API endpoint | Yes (default provided) |

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the React Native app.

## Troubleshooting

### App won't connect to Supabase
- Verify your `.env` file has the correct Supabase URL and anon key
- Make sure you copied `.env.example` to `.env`
- Check that Supabase project is active (not paused)
- Verify database migrations have been run

### QR code won't scan
- Make sure your iPhone and computer are on the same WiFi network
- Try manually entering the URL shown in the terminal into Expo Go
- Restart the Expo development server

### Changes not showing on iPhone
- Check the terminal for any bundling errors
- Try shaking your iPhone and selecting "Reload" in the Expo menu
- Restart the Expo development server

### No recipes showing
- Ensure you've seeded the database with recipe data
- Check Supabase dashboard to verify recipes table has data
- Look for errors in the Expo console

## Contributing

This is a personal project, but if you'd like to suggest features or report bugs:

1. Open an issue describing the feature/bug
2. If submitting a PR, please include tests and follow the existing code style
3. Make sure all changes work on iPhone via Expo Go

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Expo](https://expo.dev/) and [React Native](https://reactnative.dev/)
- Backend powered by [Supabase](https://supabase.com/)
- Recipe data from [TheMealDB](https://www.themealdb.com/)
- Design inspiration from modern dating apps
- Font families from [Google Fonts](https://fonts.google.com/)

---

Made with love for couples who can't decide what to eat.
