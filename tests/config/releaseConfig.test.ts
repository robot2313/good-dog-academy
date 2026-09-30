import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ExpoConfig = {
  expo: {
    slug: string;
    icon: string;
    scheme: string;
    userInterfaceStyle: string;
    backgroundColor: string;
    ios: { supportsTablet: boolean; bundleIdentifier: string; buildNumber: string };
    android: {
      package: string;
      versionCode: number;
      blockedPermissions?: string[];
      adaptiveIcon: { foregroundImage: string; backgroundColor: string };
    };
    plugins: unknown[];
  };
};

describe('release configuration', () => {
  const root = resolve(__dirname, '../..');
  const config = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8')) as ExpoConfig;
  const eas = JSON.parse(readFileSync(resolve(root, 'eas.json'), 'utf8')) as { build: Record<string, unknown> };

  it('uses the approved permanent app identity and warm production branding', () => {
    expect(config.expo.slug).toBe('good-dog-academy');
    expect(config.expo.scheme).toBe('gooddogacademy');
    expect(config.expo.userInterfaceStyle).toBe('light');
    expect(config.expo.backgroundColor).toBe('#FBF8F0');
    expect(config.expo.ios).toMatchObject({
      supportsTablet: false,
      bundleIdentifier: 'com.robot2313.gooddogacademy',
      buildNumber: '1',
    });
    expect(config.expo.android).toMatchObject({
      package: 'com.robot2313.gooddogacademy',
      versionCode: 1,
    });
  });

  it('references real icon, adaptive-icon, and splash assets', () => {
    const assetPaths = [config.expo.icon, config.expo.android.adaptiveIcon.foregroundImage];
    for (const assetPath of assetPaths) expect(existsSync(resolve(root, assetPath))).toBe(true);
    expect(JSON.stringify(config.expo.plugins)).toContain('expo-splash-screen');
  });

  it('configures optional speech recognition and defines preview and production builds', () => {
    expect(config.expo.android.blockedPermissions ?? []).not.toContain('android.permission.RECORD_AUDIO');
    const plugins = JSON.stringify(config.expo.plugins);
    expect(plugins).toContain('expo-speech-recognition');
    expect(plugins).toContain('spoken training responses');
    expect(eas.build).toHaveProperty('preview');
    expect(eas.build).toHaveProperty('production');
  });
});
