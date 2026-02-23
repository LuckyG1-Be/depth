import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <div className="grid gap-4">
      <Card>
        <h1 className="text-2xl font-semibold tracking-tight">Depth</h1>
        <p className="mt-2 text-zinc-600">Match op kernwaarden & passies. Foto&apos;s unlocken pas na 5 berichten elk.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/register"><Button>Account maken</Button></Link>
          <Link href="/login"><Button variant="ghost">Inloggen</Button></Link>
          <Link href="/discover"><Button variant="ghost">Discover</Button></Link>
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Wat is anders?</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700">
            <li>60% kernwaarden, 25% passies</li>
            <li>5 verplichte Depth Questions</li>
            <li>Foto&apos;s pas zichtbaar na wederzijdse chat</li>
            <li>Verificatie + basis fraudefilters</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Demo</h2>
          <p className="mt-2 text-sm text-zinc-700">Na seeding: <span className="font-mono">demo1@depth.local</span> / <span className="font-mono">password123</span></p>
        </Card>
      </div>
    </div>
  );
}
