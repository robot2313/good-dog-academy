import { managedDogPhotoFileName } from '../../src/features/onboarding/photo/ExpoDogPhotoStorage';

describe('managedDogPhotoFileName', () => {
  it('produces a different file name for each save so the image URI always changes', () => {
    const first = managedDogPhotoFileName('dog-1', '.jpg', 'token-a');
    const second = managedDogPhotoFileName('dog-1', '.jpg', 'token-b');

    // The regression: a deterministic name kept the same file:// URI on replace,
    // so React Native's Image cache showed the old photo. A unique token per
    // save changes the URI and forces the new image to load.
    expect(first).not.toBe(second);
    expect(first).toBe('dog-1-token-a.jpg');
    expect(second).toBe('dog-1-token-b.jpg');
  });

  it('keeps a valid extension and falls back to .jpg for unusual inputs', () => {
    expect(managedDogPhotoFileName('dog-1', '.PNG', 'tok')).toBe('dog-1-tok.png');
    expect(managedDogPhotoFileName('dog-1', '', 'tok')).toBe('dog-1-tok.jpg');
    expect(managedDogPhotoFileName('dog-1', '.notanext-really', 'tok')).toBe('dog-1-tok.jpg');
  });
});
