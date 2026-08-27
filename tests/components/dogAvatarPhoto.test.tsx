import { render } from '@testing-library/react-native';
import { Image } from 'react-native';

import { DogAvatar } from '../../src/components/DogAvatar';
import { DogIdentityHero } from '../../src/components/DogIdentityHero';

const OLD_URI = 'file:///documents/dog-photos/dog-1-old.jpg';
const NEW_URI = 'file:///documents/dog-photos/dog-1-new.jpg';

describe('dog photo rendering', () => {
  it('shows the current photoUri and updates immediately when it changes', () => {
    const view = render(<DogAvatar dogName="Pepper" photoUri={OLD_URI} size={120} />);
    expect(view.UNSAFE_getByType(Image).props.source).toEqual({ uri: OLD_URI });

    // A new managed URI (from a replacement) must be reflected right away.
    view.rerender(<DogAvatar dogName="Pepper" photoUri={NEW_URI} size={120} />);
    expect(view.UNSAFE_getByType(Image).props.source).toEqual({ uri: NEW_URI });
  });

  it('falls back to the neutral initial when there is no photo', () => {
    const view = render(<DogAvatar dogName="Pepper" photoUri={null} size={120} />);
    expect(view.UNSAFE_queryByType(Image)).toBeNull();
    expect(view.getByText('P', { includeHiddenElements: true })).toBeTruthy();
  });

  it('the shared dog identity hero renders the same photo source', () => {
    const view = render(
      <DogIdentityHero dogName="Pepper" photoUri={NEW_URI} eyebrow="DOG" title="Pepper" />,
    );
    expect(view.UNSAFE_getByType(Image).props.source).toEqual({ uri: NEW_URI });
  });
});
