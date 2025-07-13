interface SocialIconLinkProps {
  href: string;
  label: string;
  children: React.ReactNode;
}

export function SocialIconLink({ href, label, children }: SocialIconLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 hover:text-white transition-colors"
      aria-label={label}
    >
      {children}
    </a>
  );
}
