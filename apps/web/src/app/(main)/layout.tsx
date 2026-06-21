import BottomNav from '@/components/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main style={{ paddingBottom: '64px' }}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
