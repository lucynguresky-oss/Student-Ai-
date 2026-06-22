import BottomNav from '@/components/BottomNav';
import PomodoroTimer from '@/components/PomodoroTimer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main style={{ paddingBottom: '64px' }}>
        {children}
      </main>
      <PomodoroTimer />
      <BottomNav />
    </>
  );
}
