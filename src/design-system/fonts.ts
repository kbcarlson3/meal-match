/**
 * Font loading configuration using @expo-google-fonts
 */
import {
  useFonts,
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

export const useMealMatchFonts = () => {
  const [fontsLoaded] = useFonts({
    // Display font - Fraunces
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,

    // Body font - Newsreader
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,

    // UI font - DM Sans
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  return fontsLoaded;
};

// Map design token font families to actual font names
export const getFontFamily = (
  family: 'display' | 'body' | 'ui',
  weight: 'normal' | 'medium' | 'semibold' | 'bold' = 'normal'
): string => {
  const fontMap = {
    display: {
      normal: 'Fraunces_400Regular',
      medium: 'Fraunces_500Medium',
      semibold: 'Fraunces_600SemiBold',
      bold: 'Fraunces_700Bold',
    },
    body: {
      normal: 'Newsreader_400Regular',
      medium: 'Newsreader_500Medium',
      semibold: 'Newsreader_600SemiBold',
      bold: 'Newsreader_700Bold',
    },
    ui: {
      normal: 'DMSans_400Regular',
      medium: 'DMSans_500Medium',
      semibold: 'DMSans_500Medium',
      bold: 'DMSans_700Bold',
    },
  };

  return fontMap[family][weight];
};
