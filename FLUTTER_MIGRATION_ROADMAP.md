# Flutter UI Migration Roadmap

## Executive Summary

**Current Stack:**
- Frontend: Next.js (React) + TypeScript
- Backend: Express.js + MongoDB
- Video Rendering: Remotion (React-based)

**Target Stack:**
- Frontend: Flutter (Mobile/Desktop/Web)
- Backend: Express.js + MongoDB (Unchanged)
- Video Rendering: **Challenge** - Remotion is React-based

---

## 1. Platform Strategy

### Option A: Flutter Mobile (iOS/Android) ⭐ **Recommended**
**Pros:**
- Native performance
- Rich mobile UI/UX
- Access to device features (camera, gallery)
- Better for content creation on-the-go
- Large Flutter ecosystem

**Cons:**
- Video rendering complexity (need alternative to Remotion)
- Smaller screen for complex editor
- Need separate desktop/web version

**Best For:** Mobile-first video creation app

---

### Option B: Flutter Desktop (Windows/macOS/Linux)
**Pros:**
- Larger screen for complex editor
- Better for professional editing
- Native desktop experience
- Can leverage desktop resources

**Cons:**
- Smaller user base
- Desktop Flutter is newer (less mature)
- Video rendering still a challenge

**Best For:** Professional desktop video editor

---

### Option C: Flutter Web
**Pros:**
- Single codebase for all platforms
- Easy deployment
- No app store approval

**Cons:**
- **Not recommended** - Flutter Web has limitations:
  - Larger bundle size
  - Slower performance
  - Limited browser compatibility
  - Not ideal for complex video editing

**Best For:** Simple web apps (not recommended for this use case)

---

### Option D: Hybrid Approach ⭐ **Best Strategy**
- **Mobile App**: Flutter (iOS/Android) - Simplified editor, preview, project management
- **Desktop App**: Flutter (Windows/macOS) - Full-featured editor
- **Web**: Keep Next.js for complex editing OR use Flutter Web for simple views

**Recommendation:** Start with **Flutter Mobile** for MVP, then expand to Desktop

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────┐
│                    Flutter UI Layer        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Mobile  │  │ Desktop  │  │   Web    │  │
│  │   App    │  │   App    │  │   App    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│         │            │            │        │
│         └────────────┴────────────┘        │
│                    │                       │
│         ┌───────────▼───────────┐          │
│         │   API Service Layer   │          │
│         │  (HTTP/REST Client)   │          │
│         └───────────┬───────────┘          │
└────────────────────┼───────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   Express.js Backend  │
         │   (Unchanged)         │
         │  - REST API           │
         │  - MongoDB            │
         │  - File Storage       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Video Rendering      │
         │   (Alternative to       │
         │    Remotion)           │
         └───────────────────────┘
```

---

## 3. Technology Stack

### Flutter Core
```yaml
Flutter SDK: ^3.16.0+
Dart: ^3.2.0+

State Management:
  - Provider / Riverpod (Recommended: Riverpod)
  - OR Bloc Pattern
  - OR GetX

HTTP Client:
  - dio (Recommended)
  - OR http

Local Storage:
  - shared_preferences
  - hive (for complex data)
  - sqflite (if needed)

File Handling:
  - file_picker
  - image_picker
  - path_provider

Video/Audio:
  - video_player
  - chewie (video player UI)
  - just_audio (audio playback)
  - ffmpeg_kit_flutter (video processing)

UI Components:
  - flutter_slidable
  - flutter_staggered_grid_view
  - syncfusion_flutter_sliders
  - flutter_colorpicker

Networking:
  - web_socket_channel (for real-time updates)
  - connectivity_plus (network status)
```

---

## 4. Video Rendering Solution

### Challenge: Remotion is React-based
**Current:** Remotion runs in Node.js/React environment

### Solutions:

#### Option 1: Server-Side Rendering Only ⭐ **Recommended**
- Keep Remotion on backend (Express.js)
- Flutter app triggers render via API
- Backend handles all video rendering
- Flutter shows progress and downloads result

**Pros:**
- No changes to rendering pipeline
- Consistent output
- Leverage existing Remotion setup

**Cons:**
- Requires server for rendering
- No client-side preview rendering

**Implementation:**
```dart
// Flutter calls backend API
POST /api/v1/render
{
  "projectId": "...",
  "resolution": "1920x1080",
  "fps": 30
}

// Poll for status
GET /api/v1/render/:jobId/status

// Download when complete
GET /api/v1/render/download/:jobId
```

---

#### Option 2: FFmpeg-Based Rendering
- Use `ffmpeg_kit_flutter` in Flutter
- Compose video from assets on device
- More control but complex

**Pros:**
- Offline rendering
- Full control
- No server dependency

**Cons:**
- Complex implementation
- Large app size (FFmpeg)
- Performance concerns on mobile
- Need to reimplement Remotion features

---

#### Option 3: Hybrid Approach
- **Preview**: Use Flutter video player with composited layers
- **Final Render**: Server-side Remotion
- Best of both worlds

**Pros:**
- Fast preview in app
- High-quality final render
- Good user experience

**Cons:**
- More complex implementation
- Two rendering systems to maintain

---

## 5. API Communication Strategy

### REST API Client Setup
```dart
// lib/services/api_service.dart
class ApiService {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3001/api/v1',
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );

  // Projects
  Future<Project> getProject(String id) async { ... }
  Future<Project> createProject(CreateProjectRequest request) async { ... }
  Future<Project> updateProject(String id, UpdateProjectRequest request) async { ... }
  
  // Scenes
  Future<List<Scene>> getScenes(String projectId) async { ... }
  Future<Scene> createScene(String projectId, CreateSceneRequest request) async { ... }
  Future<Scene> updateScene(String projectId, String sceneId, UpdateSceneRequest request) async { ... }
  
  // Assets
  Future<AssetSearchResult> searchAssets(String query, {String? type, int? page}) async { ... }
  Future<void> uploadAsset(File file) async { ... }
  
  // Rendering
  Future<RenderJob> startRender(String projectId, RenderOptions options) async { ... }
  Future<RenderStatus> getRenderStatus(String jobId) async { ... }
  Future<void> downloadRender(String jobId, String savePath) async { ... }
}
```

### State Management with Riverpod
```dart
// lib/providers/project_provider.dart
final projectProvider = StateNotifierProvider<ProjectNotifier, ProjectState>((ref) {
  return ProjectNotifier(ref.read(apiServiceProvider));
});

class ProjectNotifier extends StateNotifier<ProjectState> {
  final ApiService _apiService;
  
  Future<void> loadProject(String id) async {
    state = state.copyWith(loading: true);
    try {
      final project = await _apiService.getProject(id);
      state = state.copyWith(project: project, loading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), loading: false);
    }
  }
}
```

---

## 6. UI Component Migration

### Component Mapping

| React Component | Flutter Equivalent | Package/Approach |
|----------------|-------------------|-----------------|
| `ScenesPanel` | `ListView.builder` / `ReorderableListView` | Custom widget |
| `CanvasPreview` | `VideoPlayer` + `Stack` for overlays | `video_player` + custom compositing |
| `TransformControls` | `Slider` + `TextField` | Material widgets |
| `ResizableSidebar` | `Draggable` / `GestureDetector` | Custom implementation |
| `Topbar` | `AppBar` / Custom `Row` | Material widgets |
| `CommonPanel` | `GridView` / `ListView` | Material widgets |
| `Modal` | `showDialog` / `showModalBottomSheet` | Material widgets |

### Key UI Patterns

#### 1. Resizable Panels
```dart
// Custom resizable panel widget
class ResizablePanel extends StatefulWidget {
  final Widget child;
  final double initialWidth;
  final double minWidth;
  final double maxWidth;
  
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onHorizontalDragUpdate: (details) {
            // Update width based on drag
          },
          child: Container(
            width: _width,
            child: child,
          ),
        );
      },
    );
  }
}
```

#### 2. Canvas Preview with Overlays
```dart
class CanvasPreview extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Video/Image background
        VideoPlayerWidget(videoUrl: scene.mediaUrl),
        
        // Asset overlays
        ...scene.assets.map((asset) => Positioned(
          left: asset.x,
          top: asset.y,
          child: Transform(
            scale: asset.scale,
            rotation: asset.rotation,
            child: Opacity(
              opacity: asset.opacity,
              child: AssetWidget(asset: asset),
            ),
          ),
        )),
        
        // Captions overlay
        Positioned(
          bottom: 0,
          child: CaptionWidget(caption: scene.caption),
        ),
      ],
    );
  }
}
```

#### 3. Scene List with Drag & Drop
```dart
class ScenesPanel extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ReorderableListView(
      onReorder: (oldIndex, newIndex) {
        // Handle reordering
      },
      children: scenes.map((scene) => SceneCard(
        key: ValueKey(scene.id),
        scene: scene,
        onTap: () => selectScene(scene.id),
      )).toList(),
    );
  }
}
```

---

## 7. State Management Architecture

### Recommended: Riverpod
```dart
// lib/providers/
├── project_provider.dart      // Current project state
├── scenes_provider.dart        // Scenes list
├── selected_scene_provider.dart // Currently selected scene
├── assets_provider.dart         // Assets for current scene
├── render_provider.dart         // Render job status
└── ui_provider.dart            // UI state (panels, modals)

// Example
final selectedSceneProvider = StateProvider<Scene?>((ref) => null);

final sceneAssetsProvider = FutureProvider.family<List<Asset>, String>((ref, sceneId) async {
  final apiService = ref.read(apiServiceProvider);
  return await apiService.getSceneAssets(sceneId);
});
```

---

## 8. File Handling & Storage

### Local Storage
```dart
// lib/services/storage_service.dart
class StorageService {
  // Save project locally
  Future<void> saveProjectLocally(Project project) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('project_${project.id}', jsonEncode(project.toJson()));
  }
  
  // Load project locally
  Future<Project?> loadProjectLocally(String projectId) async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('project_$projectId');
    return json != null ? Project.fromJson(jsonDecode(json)) : null;
  }
  
  // Cache assets
  Future<File> cacheAsset(String url) async {
    final cacheDir = await getTemporaryDirectory();
    final file = File('${cacheDir.path}/${url.hashCode}');
    if (!await file.exists()) {
      final response = await dio.download(url, file.path);
    }
    return file;
  }
}
```

### File Upload
```dart
Future<void> uploadAsset(File file) async {
  final formData = FormData.fromMap({
    'file': await MultipartFile.fromFile(file.path),
  });
  
  final response = await dio.post('/api/v1/assets/upload', data: formData);
  return Asset.fromJson(response.data);
}
```

---

## 9. Real-Time Updates

### WebSocket Integration (Optional)
```dart
// For real-time render progress, collaboration, etc.
class WebSocketService {
  late WebSocketChannel _channel;
  
  void connect(String projectId) {
    _channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost:3001/ws/project/$projectId'),
    );
    
    _channel.stream.listen((message) {
      final data = jsonDecode(message);
      // Handle updates
      if (data['type'] == 'render_progress') {
        // Update render progress
      }
    });
  }
}
```

---

## 10. Migration Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up Flutter project structure
- [ ] Configure API service layer
- [ ] Implement authentication (if needed)
- [ ] Set up state management (Riverpod)
- [ ] Create base UI components
- [ ] Implement project list/creation

**Deliverable:** Basic project management in Flutter

---

### Phase 2: Core Features (Weeks 3-5)
- [ ] Scene list panel
- [ ] Scene creation/editing
- [ ] Basic canvas preview
- [ ] Asset search and selection
- [ ] Transform controls (position, scale, rotation)
- [ ] Caption editing

**Deliverable:** Basic video editing functionality

---

### Phase 3: Advanced Features (Weeks 6-8)
- [ ] Resizable panels
- [ ] Drag & drop scene reordering
- [ ] Asset layering (z-index)
- [ ] Animation controls
- [ ] Caption styling
- [ ] Project save/load

**Deliverable:** Full editing capabilities

---

### Phase 4: Rendering Integration (Weeks 9-10)
- [ ] Render job creation
- [ ] Progress polling
- [ ] Download rendered video
- [ ] Preview rendering (if implementing Option 3)

**Deliverable:** Complete video export workflow

---

### Phase 5: Polish & Optimization (Weeks 11-12)
- [ ] Performance optimization
- [ ] Error handling
- [ ] Offline support
- [ ] UI/UX improvements
- [ ] Testing
- [ ] Documentation

**Deliverable:** Production-ready app

---

## 11. Project Structure

```
flutter_app/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   │
│   ├── models/              # Data models
│   │   ├── project.dart
│   │   ├── scene.dart
│   │   ├── asset.dart
│   │   └── render_job.dart
│   │
│   ├── services/            # API & business logic
│   │   ├── api_service.dart
│   │   ├── storage_service.dart
│   │   ├── render_service.dart
│   │   └── asset_service.dart
│   │
│   ├── providers/           # State management
│   │   ├── project_provider.dart
│   │   ├── scenes_provider.dart
│   │   ├── assets_provider.dart
│   │   └── render_provider.dart
│   │
│   ├── screens/             # Main screens
│   │   ├── home_screen.dart
│   │   ├── project_list_screen.dart
│   │   ├── editor_screen.dart
│   │   └── render_screen.dart
│   │
│   ├── widgets/             # Reusable widgets
│   │   ├── scenes_panel.dart
│   │   ├── canvas_preview.dart
│   │   ├── transform_controls.dart
│   │   ├── asset_card.dart
│   │   └── resizable_panel.dart
│   │
│   ├── utils/               # Utilities
│   │   ├── constants.dart
│   │   ├── helpers.dart
│   │   └── validators.dart
│   │
│   └── theme/               # App theming
│       ├── app_theme.dart
│       └── colors.dart
│
├── test/
├── pubspec.yaml
└── README.md
```

---

## 12. Key Challenges & Solutions

### Challenge 1: Video Rendering
**Problem:** Remotion is React-based, can't use in Flutter

**Solution:** 
- Keep Remotion on backend
- Flutter triggers render via API
- Show progress and download result

---

### Challenge 2: Complex UI Layout
**Problem:** Resizable panels, drag & drop, complex layouts

**Solution:**
- Use `LayoutBuilder` and `GestureDetector`
- Custom widgets for resizable panels
- `ReorderableListView` for drag & drop

---

### Challenge 3: Real-Time Preview
**Problem:** Need to preview video with overlays in real-time

**Solution:**
- Use `video_player` + `Stack` for overlays
- Compose preview from assets
- May not be pixel-perfect but functional

---

### Challenge 4: State Synchronization
**Problem:** Keep Flutter UI in sync with backend

**Solution:**
- Use Riverpod for state management
- Poll for updates or use WebSockets
- Optimistic updates with rollback

---

### Challenge 5: File Handling
**Problem:** Large video files, caching, uploads

**Solution:**
- Use `dio` for uploads with progress
- Cache assets locally
- Stream large files

---

## 13. API Endpoints Needed

### Projects
```
GET    /api/v1/projects              # List projects
POST   /api/v1/projects              # Create project
GET    /api/v1/projects/:id          # Get project
PUT    /api/v1/projects/:id          # Update project
DELETE /api/v1/projects/:id          # Delete project
```

### Scenes
```
GET    /api/v1/projects/:id/scenes   # List scenes
POST   /api/v1/projects/:id/scenes   # Create scene
GET    /api/v1/projects/:id/scenes/:sceneId  # Get scene
PUT    /api/v1/projects/:id/scenes/:sceneId  # Update scene
DELETE /api/v1/projects/:id/scenes/:sceneId  # Delete scene
```

### Assets
```
GET    /api/v1/assets/search         # Search assets
POST   /api/v1/assets/upload         # Upload asset
GET    /api/v1/assets/:id            # Get asset
DELETE /api/v1/assets/:id            # Delete asset
```

### Rendering
```
POST   /api/v1/render                # Start render
GET    /api/v1/render/:jobId/status  # Get render status
GET    /api/v1/render/download/:jobId # Download video
```

---

## 14. Testing Strategy

### Unit Tests
- API service methods
- State management logic
- Utility functions
- Models

### Widget Tests
- Individual widgets
- User interactions
- State changes

### Integration Tests
- Full user flows
- API integration
- File operations

---

## 15. Performance Considerations

### Optimization Tips
1. **Lazy Loading**: Load scenes/assets on demand
2. **Caching**: Cache API responses and assets
3. **Image Optimization**: Compress images before upload
4. **List Virtualization**: Use `ListView.builder` for long lists
5. **Debouncing**: Debounce search and API calls
6. **Background Processing**: Use isolates for heavy computations

---

## 16. Deployment Strategy

### Mobile (iOS/Android)
- Build with `flutter build ios` / `flutter build apk`
- Submit to App Store / Google Play
- Use Firebase for analytics/crash reporting

### Desktop (Windows/macOS/Linux)
- Build with `flutter build windows` / `flutter build macos` / `flutter build linux`
- Package as installer
- Code signing for macOS/Windows

---

## 17. Timeline Estimate

### MVP (Minimum Viable Product)
**Duration:** 8-10 weeks
- Basic project management
- Scene editing
- Asset management
- Video rendering (server-side)
- Basic UI

### Full Featured
**Duration:** 12-16 weeks
- All MVP features
- Advanced editing
- Real-time preview
- Offline support
- Polish & optimization

---

## 18. Cost Considerations

### Development
- Flutter developers: $50-150/hour
- Backend (unchanged): No additional cost
- Testing: 20-30% of dev time

### Infrastructure
- Backend hosting: Same as current
- CDN for assets: May need upgrade
- Mobile app stores: $99/year (iOS), $25 one-time (Android)

---

## 19. Recommendations

### Start With:
1. ✅ **Flutter Mobile** (iOS/Android)
2. ✅ **Server-side rendering** (keep Remotion on backend)
3. ✅ **Riverpod** for state management
4. ✅ **dio** for HTTP client
5. ✅ **MVP approach** - start simple, iterate

### Avoid:
1. ❌ Flutter Web (for now)
2. ❌ Client-side video rendering (too complex)
3. ❌ Over-engineering (start simple)

---

## 20. Next Steps

1. **Decision**: Choose platform (Mobile/Desktop/Hybrid)
2. **Setup**: Create Flutter project structure
3. **API**: Document all API endpoints
4. **Prototype**: Build basic project list screen
5. **Iterate**: Add features incrementally

---

## Questions to Answer

1. **Platform Priority**: Mobile first or Desktop first?
2. **Rendering**: Server-side only or need client-side preview?
3. **Timeline**: What's the target launch date?
4. **Team**: Do you have Flutter developers?
5. **Budget**: What's the development budget?

---

## Conclusion

Migrating to Flutter is **feasible** but requires:
- ✅ Keeping backend unchanged (good!)
- ⚠️ Handling video rendering differently (server-side)
- ✅ Rebuilding UI components in Flutter
- ✅ Managing state with Flutter patterns

**Recommendation:** Start with **Flutter Mobile** + **Server-side rendering** for MVP, then expand based on feedback.

