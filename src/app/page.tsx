import WordPressConnection from "@/components/WordPressConnection";

export default function Home() {
  return (
    <main>
      <h1>SiteLift</h1>
      <p>WordPress Content Exporter</p>
      <p>Connect. Extract. Export.</p>
      <WordPressConnection />
    </main>
  );
}