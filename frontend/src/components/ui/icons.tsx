import type { SVGProps } from 'react';

/**
 * Inline stroke icons.
 *
 * Bundled as components rather than an icon package: the set is small, it ships
 * no runtime, and each glyph inherits `currentColor` so it follows the theme
 * without a second dark-mode asset. Every icon is decorative — the accessible
 * name always comes from the control that contains it.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      viewBox="0 0 24 24"
      {...props}
    >
      {children}
    </svg>
  );
}

export const SearchIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const PinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Icon>
);

export const BedIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 18v-8m0 4h18m0 4v-6a3 3 0 0 0-3-3H9v5" />
    <circle cx="6.5" cy="10.5" r="1.7" />
  </Icon>
);

export const BathIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
    <path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4c1.2 0 2 .7 2.3 1.7" />
    <path d="M7 19.5 6 21m11-1.5 1 1.5" />
  </Icon>
);

export const RulerIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 15.5 15.5 4l4.5 4.5L8.5 20z" />
    <path d="M8 11.5 9.8 13.3M11 8.5l1.8 1.8M14 5.5l1.8 1.8" />
  </Icon>
);

export const HeartIcon = ({
  filled = false,
  ...props
}: IconProps & { filled?: boolean }) => (
  <Icon fill={filled ? 'currentColor' : 'none'} {...props}>
    <path d="M12 20s-7.5-4.7-7.5-10A4.2 4.2 0 0 1 12 7.2 4.2 4.2 0 0 1 19.5 10c0 5.3-7.5 10-7.5 10Z" />
  </Icon>
);

export const SlidersIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 7h14M5 12h14M5 17h14" />
    <circle cx="9" cy="7" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Icon>
);

export const ArrowIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14m-5.5-5.5L19 12l-5.5 5.5" />
  </Icon>
);

export const ChevronIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m7 10 5 5 5-5" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);

export const MenuIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);

export const SunIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Icon>
);

export const MoonIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 13.4A8 8 0 0 1 10.6 4a8 8 0 1 0 9.4 9.4Z" />
  </Icon>
);

export const AutoThemeIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect height="12" rx="2" width="17" x="3.5" y="4.5" />
    <path d="M9 20h6" />
  </Icon>
);

export const ShieldIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 21s7-3.2 7-9V6.2L12 3.5 5 6.2V12c0 5.8 7 9 7 9Z" />
    <path d="m9.2 11.8 2 2 3.6-3.8" />
  </Icon>
);

export const SparkIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

export const MapIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z" />
    <path d="M9 4v14m6-11.5V20" />
  </Icon>
);

export const ListIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.2" />
    <circle cx="4.5" cy="12" r="1.2" />
    <circle cx="4.5" cy="18" r="1.2" />
  </Icon>
);
