import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">
          AI Remotion Studio
        </h1>
        <p className="text-center mb-8 text-gray-300">
          Generate professional videos from text prompts using AI
        </p>
        <div className="flex justify-center">
          <Link
            href="/create"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Video
          </Link>
        </div>
      </div>
    </main>
  );
}
