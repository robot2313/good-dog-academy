import { Platform } from 'react-native';

export type SessionExportResult = 'downloaded' | 'shared' | 'unavailable';
export interface SessionExporter { exportCsv(csv: string, fileName: string): Promise<SessionExportResult>; }

declare const require: (moduleName: string) => unknown;

export class ExpoSessionExporter implements SessionExporter {
  async exportCsv(csv: string, fileName: string): Promise<SessionExportResult> {
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return 'downloaded';
    }

    const { Directory, File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
    const Sharing = require('expo-sharing') as typeof import('expo-sharing');
    if (!await Sharing.isAvailableAsync()) return 'unavailable';
    const directory = new Directory(Paths.cache, 'training-journal-exports');
    directory.create({ idempotent: true, intermediates: true });
    const file = new File(directory, fileName);
    file.create({ overwrite: true, intermediates: true });
    file.write(`\uFEFF${csv}`);
    await Sharing.shareAsync(file.uri, { dialogTitle: 'Export training journal', mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    return 'shared';
  }
}

export const sessionExporter = new ExpoSessionExporter();
