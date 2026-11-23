'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type IconElement = React.SVGProps<SVGSVGElement> & {
  title?: string;
  titleId?: string;
};

export type TabProps = {
  Icon: React.FC<IconElement>;
  text: string;
  to: string;
};

export function Tab({ Icon, text, to }: TabProps) {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <li className={isActive ? `cursor-default` : `cursor-pointer`}>
      <Link
        href={to}
        className={`group w-full gap-x-2 max-w-[12rem] inline-flex items-center justify-around p-4 rounded-t-lg border-b-2 ${
          isActive
            ? 'text-navy border-navy'
            : 'border-transparent hover:text-gray-600 hover:border-gray-300'
        }`}
      >
        <Icon
          className={`w-5 h-5 ${
            isActive
              ? 'text-navy'
              : 'text-gray-400 group-hover:text-gray-500'
          }`}
        />
        <p className="flex-1">{text}</p>
      </Link>
    </li>
  );
}
