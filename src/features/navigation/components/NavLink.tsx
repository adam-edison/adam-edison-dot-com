import Link from 'next/link';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ href, children, className }: NavLinkProps) {
  const baseClasses = 'text-gray-300 hover:text-white transition-colors';
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <Link href={href} className={combinedClasses}>
      {children}
    </Link>
  );
}
