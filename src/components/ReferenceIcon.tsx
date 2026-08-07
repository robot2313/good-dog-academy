import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import type { BehaviourSkill } from '../domain/models';

export type ReferenceIconName =
  | 'menu'
  | 'bell'
  | 'home'
  | 'journey'
  | 'categories'
  | 'dog'
  | 'progress'
  | 'back'
  | 'bookmark'
  | 'check'
  | 'lock'
  | 'chevron'
  | 'camera'
  | 'plus'
  | BehaviourSkill;

type Props = {
  readonly name: ReferenceIconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
};

export function ReferenceIcon({ name, size = 22, color = '#102A4C', strokeWidth = 1.9 }: Props): React.JSX.Element {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24">
      {name === 'menu' ? <><Line x1="4" y1="7" x2="20" y2="7" {...common} /><Line x1="4" y1="12" x2="20" y2="12" {...common} /><Line x1="4" y1="17" x2="16" y2="17" {...common} /></> : null}
      {name === 'bell' ? <><Path d="M6.7 10.2c0-3.1 1.8-5.2 5.3-5.2s5.3 2.1 5.3 5.2v3.4l1.4 2.1H5.3l1.4-2.1z" {...common} /><Path d="M10 18.2c.4.9 1.1 1.4 2 1.4s1.6-.5 2-1.4" {...common} /></> : null}
      {name === 'home' ? <><Path d="m3.5 10.7 8.5-7 8.5 7" {...common} /><Path d="M5.5 9.3v10h4.2v-5.7h4.6v5.7h4.2v-10" {...common} /></> : null}
      {name === 'journey' ? <><Circle cx="6" cy="18" r="2" {...common} /><Circle cx="18" cy="6" r="2" {...common} /><Path d="M7.8 16.8c2.3-1.2 2.3-3.5 4.1-4.6 1.6-1 3.4-.2 4.4-2.4" {...common} /><Path d="m15.1 8.5 1.6 1.6 2.7-2.8" {...common} /></> : null}
      {name === 'categories' ? <><Rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.3" {...common} /><Rect x="14" y="3.5" width="6.5" height="6.5" rx="1.3" {...common} /><Rect x="3.5" y="14" width="6.5" height="6.5" rx="1.3" {...common} /><Rect x="14" y="14" width="6.5" height="6.5" rx="1.3" {...common} /></> : null}
      {name === 'dog' ? <><Circle cx="7" cy="7" r="2" {...common} /><Circle cx="17" cy="7" r="2" {...common} /><Circle cx="4.8" cy="12" r="1.8" {...common} /><Circle cx="19.2" cy="12" r="1.8" {...common} /><Path d="M12 10.2c-3.2 0-5.6 2.8-5.6 5.6 0 2.4 2.1 4.2 5.6 4.2s5.6-1.8 5.6-4.2c0-2.8-2.4-5.6-5.6-5.6Z" {...common} /></> : null}
      {name === 'progress' ? <><Path d="M4 20v-7h3.4v7M10.3 20V4h3.4v16M16.6 20v-11H20v11" {...common} /><Line x1="2.8" y1="20" x2="21.2" y2="20" {...common} /></> : null}
      {name === 'back' ? <Path d="m14.8 5.5-6.5 6.5 6.5 6.5" {...common} /> : null}
      {name === 'bookmark' ? <Path d="M7 4.2h10v15.6L12 16.7 7 19.8z" {...common} /> : null}
      {name === 'check' ? <Path d="m5 12.5 4.2 4.2L19 7" {...common} /> : null}
      {name === 'lock' ? <><Rect x="6" y="10" width="12" height="9" rx="2" {...common} /><Path d="M8.5 10V7.7a3.5 3.5 0 0 1 7 0V10" {...common} /></> : null}
      {name === 'chevron' ? <Path d="m9 5.5 6.5 6.5L9 18.5" {...common} /> : null}
      {name === 'camera' ? <><Path d="M3.6 8.6h3.6l1.5-2.2h6.6l1.5 2.2h3.6v10H3.6z" {...common} /><Circle cx="12" cy="13.4" r="3.3" {...common} /></> : null}
      {name === 'plus' ? <><Line x1="12" y1="5" x2="12" y2="19" {...common} /><Line x1="5" y1="12" x2="19" y2="12" {...common} /></> : null}
      {name === 'house-training' ? <><Path d="m3.5 11 8.5-7 8.5 7" {...common} /><Path d="M6 9.5v10h12v-10M9.2 19.5v-5.8h5.6v5.8" {...common} /></> : null}
      {name === 'chewing' ? <Path d="M7.2 9.1c-1.7-1.7-4.3-.8-4.3 1.3 0 1.2.8 2 1.8 2.3-1 .3-1.8 1.1-1.8 2.3 0 2.1 2.6 3 4.3 1.3l9.6-9.6c1.7 1.7 4.3.8 4.3-1.3 0-1.2-.8-2-1.8-2.3 1-.3 1.8-1.1 1.8-2.3 0-2.1-2.6-3-4.3-1.3z" {...common} /> : null}
      {name === 'barking' ? <><Path d="M4.5 9.5h3l5-3v11l-5-3h-3z" {...common} /><Path d="M15.3 8.2c1.5 1 2.2 2.3 2.2 3.8s-.7 2.8-2.2 3.8M18.2 5.8c2.2 1.7 3.3 3.7 3.3 6.2s-1.1 4.5-3.3 6.2" {...common} /></> : null}
      {name === 'jumping' ? <><Circle cx="12" cy="5" r="2" {...common} /><Path d="M12 7v6M8.5 10.5 12 8l3.5 2.5M9 20l3-7 3 7" {...common} /><Path d="m4.5 8 2-2 2 2M17.5 8l2-2 2 2" {...common} /></> : null}
      {name === 'recall' ? <><Path d="M5 12a7 7 0 1 1 2 4.9" {...common} /><Path d="m3 17 4.2.1-.2-4.2" {...common} /><Circle cx="12" cy="12" r="2.2" {...common} /></> : null}
      {name === 'loose-lead-walking' ? <><Circle cx="6" cy="12" r="3" {...common} /><Circle cx="18" cy="12" r="3" {...common} /><Path d="M9 12h6M6 9V6.5M18 9V6.5" {...common} /></> : null}
      {name === 'focus' ? <><Circle cx="12" cy="12" r="7.5" {...common} /><Circle cx="12" cy="12" r="3" {...common} /><Line x1="12" y1="2.5" x2="12" y2="5" {...common} /><Line x1="12" y1="19" x2="12" y2="21.5" {...common} /></> : null}
      {name === 'impulse-control' ? <><Path d="M7.3 20V9.2c0-1.2.8-2.2 1.9-2.2s1.9 1 1.9 2.2V5.5c0-1.2.8-2.2 1.9-2.2s1.9 1 1.9 2.2v3.7c0-1.2.8-2.2 1.9-2.2s1.9 1 1.9 2.2v4.9c0 3.2-2.4 5.9-5.7 5.9z" {...common} /><Path d="M7.3 12.2 5.4 10c-.8-.9-2.1-1-3-.2-.9.8-1 2.1-.2 3l5.1 5.6" {...common} /></> : null}
      {name === 'confidence' ? <><Path d="M12 3.5 19 6v5.3c0 4.3-2.8 7.5-7 9.2-4.2-1.7-7-4.9-7-9.2V6z" {...common} /><Path d="m8.5 12 2.2 2.2 4.8-5" {...common} /></> : null}
      {name === 'reactivity' ? <><Circle cx="8" cy="12" r="3.3" {...common} /><Circle cx="17" cy="12" r="3.3" {...common} /><Path d="M11.5 12h2M2.5 12H1M23 12h-1.5M8 5V3M17 5V3M8 19v2M17 19v2" {...common} /></> : null}
    </Svg>
  );
}
