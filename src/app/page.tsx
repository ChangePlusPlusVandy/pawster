import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between gap-8 px-16 py-32 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Pawster</h1>
          <Link
            href="/supply-request"
            className="text-sm text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
          >
            Supply Request
          </Link>
        </div>
      </main>
    </div>
  );
}
