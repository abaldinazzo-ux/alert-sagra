import Link from 'next/link'

export default function HomeButton() {
  return (
    <Link
      href="/"
      className="fixed top-3 left-3 z-50 flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 active:scale-95 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shadow-lg transition-all"
    >
      🏠 Home
    </Link>
  )
}
