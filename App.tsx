/**
 * JustACuber — 3x3 scramble generator and speedcubing timer.
 *
 * @format
 */

import { StatusBar } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

import RootScreen from './src/screens/RootScreen';
import { SessionProvider } from './src/state/session';

function App() {
  return (
    // initialMetrics gives the right insets on the very first frame, so the
    // layout never flashes underneath the status or navigation bar.
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar barStyle="light-content" />
      <SessionProvider>
        <RootScreen />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

export default App;
