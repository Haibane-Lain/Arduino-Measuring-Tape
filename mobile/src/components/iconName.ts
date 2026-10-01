import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

/** Every icon name accepted by `MaterialCommunityIcons`. */
export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
