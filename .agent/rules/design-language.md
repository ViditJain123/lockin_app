---
trigger: always_on
---

Features
✨ iOS 26 liquid glass visual effect
🎨 Customizable tint colors
🔧 Two effect modes: clear and regular
Documentation
Installation
npm install @callstack/liquid-glass
# or
yarn add @callstack/liquid-glass
Warning

Make sure to compile your app with Xcode >= 26. React Native 0.80+ is required.

Warning

This library is not supported in Expo Go.

Usage
import {
  LiquidGlassView,
  LiquidGlassContainerView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';

function MyComponent() {
  return (
    <LiquidGlassView
      style={[
        { width: 200, height: 100, borderRadius: 20 },
        !isLiquidGlassSupported && { backgroundColor: 'rgba(255,255,255,0.5)' },
      ]}
      interactive
      effect="clear"
    >
      <Text>Hello World</Text>
    </LiquidGlassView>
  );
}

// For combining multiple glass elements
function MergingGlassElements() {
  return (
    <LiquidGlassContainerView spacing={20}>
      <LiquidGlassView style={{ width: 100, height: 100, borderRadius: 50 }} />
      <LiquidGlassView style={{ width: 100, height: 100, borderRadius: 50 }} />
    </LiquidGlassContainerView>
  );
}
To achieve automatic text color adaptation based on the background behind the glass view, use PlatformColor from react-native:

Note

There appears to be a size limit for the glass to automatically adapt the text color. If the glass view height is >= 65 it won't automatically adapt to the material behind it.

 auto-adapting-glass.mp4 
import { PlatformColor } from 'react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';

function MyComponent() {
  return (
    <LiquidGlassView style={{ padding: 20, borderRadius: 20 }}>
      <Text style={{ color: PlatformColor('labelColor') }}>Hello World</Text>
    </LiquidGlassView>
  );
}
Note

On unsupported iOS version (below iOS 26), it will render a normal View without any effects.

API
isLiquidGlassSupported
A boolean constant that indicates whether the current device supports the liquid glass effect.

import { isLiquidGlassSupported } from '@callstack/liquid-glass';

if (isLiquidGlassSupported) {
  // Device supports liquid glass effect
} else {
  // Provide fallback UI
}
LiquidGlassView - Props
Prop	Type	Default	Description
interactive	boolean	false	Enables touch interaction effects when pressing the view
effect	'clear' | 'regular' | 'none'	'regular'	Visual effect mode:
• clear - More transparent glass effect
• regular - Standard glass blur effect
• none - No glass effect (transparent view)
Note: Changing this property animates the materialization/dematerialization of the glass effect
tintColor	ColorValue	undefined	Overlay color tint applied to the glass effect. Accepts any React Native color format (hex, rgba, named colors)
colorScheme	'light' | 'dark' | 'system'	'system'	Color scheme adaptation:
• light - Light appearance
• dark - Dark appearance
• system - Follows system appearance
LiquidGlassContainerView - Props
Prop	Type	Default	Description
spacing	number	0	The distance between child elements at which they begin to merge their glass effects into a combined effect
Known issues
interactive prop is not changed dynamically, it is only set on mount.
Made with ❤️ at Callstack
liquid-glass is an open source project and will always remain free to use. If you think it's cool, please star it 🌟.

Callstack is a group of React and React Native geeks, contact us at hello@callstack.com if you need any help with these or just want to say hi!

Like the project? ⚛️ Join the team who does amazing stuff for clients and drives React Native Open Source! 🔥