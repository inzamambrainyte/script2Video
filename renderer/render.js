import { renderMedia, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import path from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Render a video from project data
 * Usage: node render.js <projectId> <outputPath>
 */
async function main() {
  console.log('🚀 Render script started')
  console.log(`📂 Current directory: ${process.cwd()}`)
  console.log(`📦 Node version: ${process.version}`)

  const args = process.argv.slice(2)
  console.log(`📋 Arguments received: ${args.length}`)
  args.forEach((arg, i) => console.log(`  [${i}]: ${arg.substring(0, 100)}${arg.length > 100 ? '...' : ''}`))

  if (args.length < 2) {
    console.error('Usage: node render.js <projectId> <outputPath> [scenesJson]')
    process.exit(1)
  }

  const projectId = args[0]
  const outputPath = args[1]
  const scenesInput = args[2] || '[]'

  console.log(`📖 Reading scenes from: ${scenesInput.substring(0, 100)}...`)

  let scenes
  try {
    // Check if scenesInput is a file path or JSON string
    if (scenesInput.startsWith('[') || scenesInput.startsWith('{')) {
      // It's a JSON string
      console.log('📄 Parsing scenes from JSON string')
      scenes = JSON.parse(scenesInput)
    } else {
      // It's a file path - read from file
      console.log(`📂 Reading scenes from file: ${scenesInput}`)
      const fs = await import('fs')
      if (!fs.existsSync(scenesInput)) {
        throw new Error(`Scenes file not found: ${scenesInput}`)
      }
      const scenesJson = fs.readFileSync(scenesInput, 'utf-8')
      scenes = JSON.parse(scenesJson)
      console.log(`✅ Loaded ${scenes.length} scenes from file`)
    }
  } catch (e) {
    console.error('❌ Invalid scenes JSON or file:', e)
    process.exit(1)
  }

  console.log(`🎬 Rendering video for project ${projectId}`)
  console.log(`📁 Output: ${outputPath}`)
  console.log(`📝 Scenes: ${scenes.length}`)

  try {
    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.resolve(__dirname, 'src/index.tsx'),
      webpackOverride: (config) => config,
    })

    console.log('✅ Bundle created')

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'VideoComposition',
      inputProps: {
        scenes,
      },
    })

    console.log(`✅ Composition selected: ${composition.id}`)
    console.log(`   Duration: ${composition.durationInFrames} frames (${composition.durationInFrames / composition.fps}s)`)

    // Calculate total duration from scenes
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)
    const totalFrames = Math.ceil(totalDuration * composition.fps)

    // Render the video
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: totalFrames,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: {
        scenes,
      },
      timeoutInMilliseconds: 120000, // 2 minutes timeout per frame
      onProgress: ({ renderedFrames, encodedFrames, renderedDoneIn, encodedDoneIn }) => {
        const progress = (renderedFrames / totalFrames) * 100
        console.log(`⏳ Progress: ${progress.toFixed(1)}% (${renderedFrames}/${totalFrames} frames)`)
      },
    })

    console.log(`✅ Video rendered successfully: ${outputPath}`)
  } catch (error) {
    console.error('❌ Render error:', error)
    process.exit(1)
  }
}

main()

