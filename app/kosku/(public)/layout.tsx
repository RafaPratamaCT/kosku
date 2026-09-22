import { DemoNoticeBar } from '@/components/demo-notice';
import { SiteFooter } from '@/components/public/site-footer';
import { SiteNav } from '@/components/public/site-nav';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);

  return (
    <div className="flex min-h-screen flex-col">
      <DemoNoticeBar />
      <SiteNav
        kosName={settings.kosName}
        user={user ? { fullName: user.fullName, role: user.role } : null}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </div>
  );
}
