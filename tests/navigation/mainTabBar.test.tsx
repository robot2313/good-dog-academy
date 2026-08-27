import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { fireEvent, render } from '@testing-library/react-native';

import { MainTabBar } from '../../src/navigation/MainTabBar';

describe('MainTabBar', () => {
  it('exposes clear tab labels and selected state', () => {
    const { props } = tabBarProps();
    const view = render(<MainTabBar {...props} />);

    const today = view.getByRole('tab', { name: 'Today tab' });
    const academy = view.getByRole('tab', { name: 'Academy tab' });

    expect(today.props.accessibilityState).toEqual({ selected: true });
    expect(academy.props.accessibilityState).toEqual({ selected: false });
  });

  it('emits tab events and navigates only to an unselected tab', () => {
    const { props, emit, navigate } = tabBarProps();
    const view = render(<MainTabBar {...props} />);

    fireEvent.press(view.getByRole('tab', { name: 'Today tab' }));
    expect(navigate).not.toHaveBeenCalled();

    fireEvent.press(view.getByRole('tab', { name: 'Academy tab' }));
    expect(emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'academy-key',
      canPreventDefault: true,
    });
    expect(navigate).toHaveBeenCalledWith('Academy', undefined);

    fireEvent(
      view.getByRole('tab', { name: 'Academy tab' }),
      'longPress',
    );
    expect(emit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'academy-key',
    });
  });
});

function tabBarProps() {
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();
  const todayRoute = {
    key: 'today-key',
    name: 'Today',
    params: undefined,
  };
  const academyRoute = {
    key: 'academy-key',
    name: 'Academy',
    params: undefined,
  };
  const props = {
    state: {
      stale: false,
      type: 'tab',
      key: 'main-tabs',
      index: 0,
      routeNames: ['Today', 'Academy'],
      history: [],
      routes: [todayRoute, academyRoute],
    },
    descriptors: {
      'today-key': {
        options: { title: 'Today' },
        route: todayRoute,
        navigation: {},
        render: jest.fn(),
      },
      'academy-key': {
        options: { title: 'Academy' },
        route: academyRoute,
        navigation: {},
        render: jest.fn(),
      },
    },
    navigation: {
      emit,
      navigate,
    },
    insets: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  } as unknown as BottomTabBarProps;
  return { props, emit, navigate };
}
