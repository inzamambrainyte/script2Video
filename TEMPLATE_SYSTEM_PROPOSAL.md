# Template System Proposal

## Overview
A comprehensive template system that allows users to create, save, and apply reusable scene templates with predefined styles, animations, effects, and layouts.

---

## 1. Template Data Structure

### Template Schema
```typescript
interface SceneTemplate {
  id: string
  name: string
  description?: string
  category: 'minimal' | 'modern' | 'cinematic' | 'corporate' | 'social' | 'educational' | 'custom'
  thumbnailUrl?: string // Preview image/video
  isPublic: boolean // Share with other users
  isDefault: boolean // Default template for new scenes
  userId: string // Template creator
  
  // Template Properties
  properties: {
    // Caption Style
    captionStyle: CaptionStyle
    
    // Scene Transition
    transition: {
      type: 'fade' | 'slide' | 'zoom' | 'wipe' | 'dissolve' | 'none'
      duration: number // seconds
      easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
    }
    
    // Background Settings
    backgroundColor?: string
    backgroundGradient?: {
      type: 'linear' | 'radial'
      colors: string[]
      angle?: number
    }
    
    // Asset Defaults (applied to new assets)
    defaultAssetSettings: {
      animationType: AnimationType
      animationDuration: number
      animationDelay: number
      animationEasing: EasingType
      defaultPosition: {
        x: number
        y: number
        width: number
        height: number
      }
      defaultZIndex: number
    }
    
    // Layout Presets
    layout: {
      type: 'single' | 'split' | 'grid' | 'overlay' | 'custom'
      gridColumns?: number
      gridRows?: number
      overlayPositions?: Array<{x: number, y: number, width: number, height: number}>
    }
    
    // Visual Effects
    effects: {
      colorGrading?: {
        brightness?: number
        contrast?: number
        saturation?: number
        hue?: number
      }
      filters?: {
        blur?: number
        sharpen?: number
        vignette?: number
      }
    }
    
    // Typography Presets
    typography: {
      fontFamily: string
      fontSize: number
      fontWeight: string | number
      lineHeight: number
      letterSpacing: number
    }
  }
  
  // Usage Statistics
  usageCount: number
  createdAt: Date
  updatedAt: Date
}
```

---

## 2. Database Schema

### MongoDB Model
```typescript
// apps/api/src/models/SceneTemplate.ts
const SceneTemplateSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { 
    type: String, 
    enum: ['minimal', 'modern', 'cinematic', 'corporate', 'social', 'educational', 'custom'],
    default: 'custom'
  },
  thumbnailUrl: { type: String, default: null },
  isPublic: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  properties: {
    captionStyle: {
      position: { type: String, default: 'bottom' },
      x: { type: Number },
      y: { type: Number },
      fontSize: { type: Number, default: 18 },
      maxWidth: { type: Number, default: 800 },
      padding: { type: Number, default: 12 },
      backgroundColor: { type: String, default: '#000000' },
      backgroundOpacity: { type: Number, default: 0.75 },
      textColor: { type: String, default: '#ffffff' },
      fontFamily: { type: String, default: 'Arial' },
      fontWeight: { type: Schema.Types.Mixed, default: 'medium' },
      textAlign: { type: String, default: 'center' },
      borderWidth: { type: Number, default: 0 },
      borderColor: { type: String, default: '#ffffff' },
      borderRadius: { type: Number, default: 8 },
      shadow: { type: Boolean, default: false },
      blur: { type: Number, default: 0 },
      scale: { type: Number, default: 1 },
      rotation: { type: Number, default: 0 },
      opacity: { type: Number, default: 1 },
    },
    
    transition: {
      type: { type: String, enum: ['fade', 'slide', 'zoom', 'wipe', 'dissolve', 'none'], default: 'fade' },
      duration: { type: Number, default: 0.5 },
      easing: { type: String, enum: ['linear', 'easeIn', 'easeOut', 'easeInOut'], default: 'easeOut' },
    },
    
    backgroundColor: { type: String, default: '#000000' },
    backgroundGradient: {
      type: { type: String, enum: ['linear', 'radial'] },
      colors: [{ type: String }],
      angle: { type: Number, default: 0 },
    },
    
    defaultAssetSettings: {
      animationType: { type: String, default: 'fadeIn' },
      animationDuration: { type: Number, default: 1 },
      animationDelay: { type: Number, default: 0 },
      animationEasing: { type: String, default: 'easeOut' },
      defaultPosition: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        width: { type: Number, default: 100 },
        height: { type: Number, default: 100 },
      },
      defaultZIndex: { type: Number, default: 0 },
    },
    
    layout: {
      type: { type: String, enum: ['single', 'split', 'grid', 'overlay', 'custom'], default: 'single' },
      gridColumns: { type: Number },
      gridRows: { type: Number },
      overlayPositions: [{
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
      }],
    },
    
    effects: {
      colorGrading: {
        brightness: { type: Number, default: 0 },
        contrast: { type: Number, default: 0 },
        saturation: { type: Number, default: 0 },
        hue: { type: Number, default: 0 },
      },
      filters: {
        blur: { type: Number, default: 0 },
        sharpen: { type: Number, default: 0 },
        vignette: { type: Number, default: 0 },
      },
    },
    
    typography: {
      fontFamily: { type: String, default: 'Arial' },
      fontSize: { type: Number, default: 18 },
      fontWeight: { type: Schema.Types.Mixed, default: 'medium' },
      lineHeight: { type: Number, default: 1.4 },
      letterSpacing: { type: Number, default: 0 },
    },
  },
  
  usageCount: { type: Number, default: 0 },
}, { timestamps: true })
```

---

## 3. Template Categories & Presets

### Predefined Templates

#### 1. **Minimal**
- Clean, simple captions (bottom center)
- Subtle fade animations
- White text on transparent background
- Minimal borders, no shadows

#### 2. **Modern**
- Bold typography
- Gradient backgrounds
- Smooth slide animations
- High contrast colors

#### 3. **Cinematic**
- Large, dramatic captions
- Film grain effects
- Slow fade transitions
- Dark backgrounds with high opacity

#### 4. **Corporate**
- Professional fonts (Arial, Helvetica)
- Centered captions
- Subtle animations
- Brand color schemes

#### 5. **Social Media**
- Top/bottom captions
- Bold, readable fonts
- Quick animations
- Vibrant colors

#### 6. **Educational**
- Clear, readable fonts
- Bottom captions
- Minimal distractions
- High contrast

---

## 4. API Endpoints

### Template Management
```typescript
// GET /api/v1/templates
// List all templates (public + user's templates)
GET /api/v1/templates?category=modern&isPublic=true

// GET /api/v1/templates/:id
// Get template details
GET /api/v1/templates/:id

// POST /api/v1/templates
// Create new template
POST /api/v1/templates
Body: { name, description, category, properties, isPublic }

// PUT /api/v1/templates/:id
// Update template
PUT /api/v1/templates/:id
Body: { name, description, properties, ... }

// DELETE /api/v1/templates/:id
// Delete template
DELETE /api/v1/templates/:id

// POST /api/v1/templates/:id/duplicate
// Duplicate template
POST /api/v1/templates/:id/duplicate

// POST /api/v1/templates/:id/apply
// Apply template to scene(s)
POST /api/v1/templates/:id/apply
Body: { sceneIds: string[], merge?: boolean }
```

### Template from Scene
```typescript
// POST /api/v1/templates/from-scene
// Create template from existing scene
POST /api/v1/templates/from-scene
Body: { sceneId: string, name: string, description?: string }
```

---

## 5. UI/UX Design

### Template Library Panel
```
┌─────────────────────────────────────┐
│  Templates                          │
├─────────────────────────────────────┤
│  [Search] [Filter: All Categories] │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │ Minimal │ │ Modern  │ │Cinematic││
│  │ [Preview]│ │ [Preview]│ │[Preview]││
│  └─────────┘ └─────────┘ └─────────┘│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │Corporate│ │  Social │ │Education││
│  │ [Preview]│ │ [Preview]│ │[Preview]││
│  └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────┤
│  [+ Create Template]               │
│  [Save Current Scene as Template]  │
└─────────────────────────────────────┘
```

### Template Application Flow
1. User selects scene(s)
2. Opens template library
3. Browses/selects template
4. Preview shows before/after
5. Options:
   - Apply completely (replace all)
   - Merge (keep existing, add template properties)
   - Apply to selected scenes only
   - Apply to all scenes

### Template Editor
- Visual editor for creating/editing templates
- Live preview
- Save as new template
- Export/Import templates

---

## 6. Implementation Approach

### Phase 1: Core Template System
1. ✅ Database schema
2. ✅ API endpoints (CRUD)
3. ✅ Template model
4. ✅ Basic template application

### Phase 2: Template Library UI
1. ✅ Template browser component
2. ✅ Template preview cards
3. ✅ Search & filter
4. ✅ Template application modal

### Phase 3: Template Creation
1. ✅ "Save as Template" from scene
2. ✅ Template editor UI
3. ✅ Template preview generation
4. ✅ Template validation

### Phase 4: Advanced Features
1. ✅ Template categories
2. ✅ Public/Private templates
3. ✅ Template sharing
4. ✅ Template marketplace (future)

---

## 7. Template Application Logic

### Apply Template to Scene
```typescript
function applyTemplateToScene(scene: Scene, template: SceneTemplate, merge: boolean = false): Scene {
  if (merge) {
    // Merge: Keep existing, override with template where specified
    return {
      ...scene,
      captionStyle: { ...scene.captionStyle, ...template.properties.captionStyle },
      transition: template.properties.transition.type,
      // ... merge other properties
    }
  } else {
    // Replace: Use template properties completely
    return {
      ...scene,
      captionStyle: template.properties.captionStyle,
      transition: template.properties.transition.type,
      // ... apply all template properties
    }
  }
}
```

### Apply Template to New Assets
```typescript
function createAssetWithTemplateDefaults(asset: Partial<SceneAsset>, template: SceneTemplate): SceneAsset {
  return {
    ...asset,
    animationType: template.properties.defaultAssetSettings.animationType,
    animationDuration: template.properties.defaultAssetSettings.animationDuration,
    animationDelay: template.properties.defaultAssetSettings.animationDelay,
    animationEasing: template.properties.defaultAssetSettings.animationEasing,
    x: template.properties.defaultAssetSettings.defaultPosition.x,
    y: template.properties.defaultAssetSettings.defaultPosition.y,
    width: template.properties.defaultAssetSettings.defaultPosition.width,
    height: template.properties.defaultAssetSettings.defaultPosition.height,
    zIndex: template.properties.defaultAssetSettings.defaultZIndex,
  }
}
```

---

## 8. Additional Features

### Template Presets
- Pre-built templates for common use cases
- Industry-specific templates
- Seasonal templates

### Template Variables
- Dynamic placeholders (e.g., `{brandColor}`)
- Template inheritance
- Template composition (combine multiple templates)

### Template Analytics
- Most used templates
- Template performance metrics
- User preferences

### Template Versioning
- Version history
- Rollback to previous versions
- Template changelog

---

## 9. File Structure

```
apps/api/src/
  models/
    SceneTemplate.ts          # Template model
  routes/
    templates.ts              # Template API routes
  services/
    templateService.ts        # Template business logic
    templateApplicationService.ts  # Apply templates to scenes

apps/web/
  components/
    TemplateLibrary.tsx       # Template browser
    TemplateCard.tsx         # Template preview card
    TemplateEditor.tsx        # Template creation/editing
    TemplateApplicationModal.tsx  # Apply template UI
  types/
    template.ts              # Template TypeScript types
  lib/
    templateUtils.ts         # Template utilities
```

---

## 10. Benefits

1. **Consistency**: Apply same style across multiple scenes
2. **Efficiency**: Save time by reusing templates
3. **Quality**: Pre-designed templates ensure professional look
4. **Flexibility**: Create custom templates for specific needs
5. **Scalability**: Build template library over time
6. **Collaboration**: Share templates with team/users

---

## Next Steps

1. Review and approve this proposal
2. Prioritize features (Phase 1, 2, 3, 4)
3. Design database schema
4. Implement API endpoints
5. Build UI components
6. Test template system
7. Add predefined templates
8. Launch template library

---

## Questions to Consider

1. Should templates be project-specific or global?
2. Do we need template versioning?
3. Should templates include media assets or just styles?
4. Do we need template marketplace/sharing?
5. Should templates be exportable/importable?
6. Do we need template inheritance/composition?

