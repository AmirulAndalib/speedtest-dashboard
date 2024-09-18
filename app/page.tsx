import { GlobeDemo } from "@/components/wrapper/GlobeWrapper";
import Dashboard from "@/components/wrapper/Dashboard";
import Grid from "@/components/wrapper/Grid";

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <GlobeDemo />
      <div
        className="h-screen w-full py-5 flex items-center"
        style={{
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 40%)",
        }}
      >
        <Grid />
      </div>
      <div className="h-screen py-5" id="dashboard">
        <Dashboard />
      </div>
    </main>
  );
}
