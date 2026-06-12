import Link from "next/link";
import AppTool from "@/components/AppTool";
import AuthButton from "@/components/AuthButton";

export const metadata = {
  title: "MarketStack — generate your marketing suite",
};

export default function AppPage() {
  return (
    <main className="grid-bg min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-bold">
          Market<span className="gradient-text">Stack</span>
        </Link>
        <div className="flex items-center gap-4">
          <AuthButton />
          <Link href="/" className="text-sm text-white/50 hover:text-white">← Back home</Link>
        </div>
      </nav>
      <section className="mx-auto max-w-5xl px-6 py-10">
        <AppTool />
      </section>
    </main>
  );
}
