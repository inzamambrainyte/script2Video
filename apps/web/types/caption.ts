export interface CaptionStyle {
  // Position
  position: 'bottom' | 'top' | 'center' | 'custom' // Predefined or custom
  x?: number // Custom X position (percentage: 0-100)
  y?: number // Custom Y position (percentage: 0-100)
  
  // Size & Layout
  fontSize?: number // Font size in pixels
  maxWidth?: number // Max width in pixels or percentage
  padding?: number // Padding in pixels
  
  // Styling
  backgroundColor?: string // Background color (hex or rgba)
  backgroundOpacity?: number // Background opacity (0-1)
  textColor?: string // Text color (hex)
  fontFamily?: string // Font family
  fontWeight?: 'normal' | 'bold' | 'lighter' | number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  
  // Effects
  borderWidth?: number // Border width in pixels
  borderColor?: string // Border color
  borderRadius?: number // Border radius in pixels
  shadow?: boolean // Text shadow
  blur?: number // Backdrop blur amount
  
  // Transform
  scale?: number // Scale factor (1.0 = 100%)
  rotation?: number // Rotation in degrees
  opacity?: number // Overall opacity (0-1)
}

