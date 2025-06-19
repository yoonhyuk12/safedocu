import dynamic from 'next/dynamic';

const SafetyCheckForm = dynamic(() => import('@/components/SafetyCheckForm'), {
  ssr: false
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--apple-gray)]">
      <SafetyCheckForm />
    </main>
  );
}
