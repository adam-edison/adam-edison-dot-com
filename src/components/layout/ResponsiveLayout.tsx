interface ResponsiveLayoutProps {
  mobileLayout: React.ReactNode;
  desktopLayout: React.ReactNode;
  mobileClasses?: string;
  desktopClasses?: string;
}

export function ResponsiveLayout({
  mobileLayout,
  desktopLayout,
  mobileClasses = 'lg:hidden',
  desktopClasses = 'hidden lg:flex'
}: ResponsiveLayoutProps) {
  return (
    <>
      <div className={mobileClasses}>{mobileLayout}</div>
      <div className={desktopClasses}>{desktopLayout}</div>
    </>
  );
}
