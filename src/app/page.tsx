import ZipGenerator from "~/components/ZipGenerator";

export default function Home() {
  return (
    <div className="font-sans min-h-screen p-8 pb-20 sm:p-20">
      <main className="flex flex-col items-center justify-center">
        <ZipGenerator />
      </main>
    </div>
  );
}
