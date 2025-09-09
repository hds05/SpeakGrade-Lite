# Click Wave Effect Components

## Overview

Two click wave effect components for creating slam/blast animations on mouse clicks:

1. **ClickWaveEffect** - Simple, lightweight ripple effect
2. **EnhancedClickWave** - Advanced with multiple effect types and themes

## Performance Comparison

### ✅ Programmatic (Current Approach)
- **Bundle size**: ~2KB compressed
- **Memory usage**: Minimal (reuses DOM elements)
- **GPU acceleration**: CSS transforms = hardware accelerated
- **Customizable**: Easy to modify colors, sizes, timing
- **Scalable**: Works on any screen size

### ❌ Image-based Alternative
- **Bundle size**: 20-100KB per image
- **Memory usage**: Higher (image assets)
- **Quality**: Fixed resolution, pixelated on scale
- **Customization**: Requires new images for changes

## Usage Examples

### Basic Usage
```tsx
import ClickWaveEffect from './components/clickWaveEffect/ClickWaveEffect';

<ClickWaveEffect>
  <YourAppContent />
</ClickWaveEffect>
```

### Advanced Usage
```tsx
import EnhancedClickWave from './components/clickWaveEffect/EnhancedClickWave';

<EnhancedClickWave 
  effectType="blast"
  intensity="high"
  theme="rainbow"
>
  <YourAppContent />
</EnhancedClickWave>
```

## Props

### ClickWaveEffect
- `enabled`: boolean (default: true)
- `waveColor`: string (default: 'rgba(59, 130, 246, 0.6)')
- `waveSize`: number (default: 40)
- `duration`: number (default: 600)

### EnhancedClickWave
- `enabled`: boolean (default: true)
- `effectType`: 'blast' | 'ripple' | 'shockwave' | 'all'
- `intensity`: 'low' | 'medium' | 'high'
- `theme`: 'blue' | 'green' | 'purple' | 'orange' | 'rainbow'

## Performance Tips

1. **Use low intensity for mobile** to preserve battery
2. **Disable on slow devices** using feature detection
3. **Consider reduced motion preferences**:

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<ClickWaveEffect enabled={!prefersReducedMotion} />
```

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Animation Types

1. **Ripple**: Simple expanding circle
2. **Blast**: Rotating explosion with glow
3. **Shockwave**: Expanding ring border only
