import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-5xl font-bold text-white text-center">🎪 Alert Sagra</h1>
      <p className="text-gray-400 text-xl text-center max-w-md">
        Sistema di notifiche per la gestione della sagra paesana
      </p>
      <div className="grid grid-cols-2 gap-6 w-full max-w-xl mt-4">
        <Link
          href="/distribuzione"
          className="flex flex-col items-center justify-center p-8 bg-blue-700 hover:bg-blue-600 rounded-2xl text-white text-2xl font-bold text-center transition-colors"
        >
          📢<br />Distribuzione
        </Link>
        <Link
          href="/admin"
          className="flex flex-col items-center justify-center p-8 bg-gray-700 hover:bg-gray-600 rounded-2xl text-white text-2xl font-bold text-center transition-colors"
        >
          ⚙️<br />Admin
        </Link>
        <Link
          href="/cucina/interna"
          className="flex flex-col items-center justify-center p-8 bg-orange-600 hover:bg-orange-500 rounded-2xl text-white text-2xl font-bold text-center transition-colors"
        >
          🍳<br />Cucina Interna
        </Link>
        <Link
          href="/cucina/esterna"
          className="flex flex-col items-center justify-center p-8 bg-red-700 hover:bg-red-600 rounded-2xl text-white text-2xl font-bold text-center transition-colors"
        >
          🔥<br />Cucina Esterna
        </Link>
      </div>
    </main>
  );
}
