import Link from "next/link";

interface GameCardProps {
  emoji: string;
  title: string;
  description: string;
  href: string;
}

export default function GameCard({
  emoji,
  title,
  description,
  href,
}: GameCardProps) {
  return (
    <Link
      href={href}
      className="
        game-card
        group
        relative
        block
        overflow-hidden
        rounded-[1.75rem]
        border
        p-6
        transition-all
        duration-300
      "
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        boxShadow: "0 8px 30px var(--shadow-color)",
      }}
    >
      {/* ==================================================================
          Decorative teal → blue background glow
          ================================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-44
          w-44
          rounded-full
          bg-gradient-to-br
          from-teal-400/10
          via-cyan-400/8
          to-blue-500/10
          blur-3xl
          opacity-70
          transition-all
          duration-500
          group-hover:scale-125
          group-hover:opacity-100
        "
      />

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-20
          -left-16
          h-40
          w-40
          rounded-full
          bg-gradient-to-tr
          from-teal-400/5
          to-blue-500/10
          blur-3xl
          opacity-50
          transition-all
          duration-500
          group-hover:scale-110
          group-hover:opacity-80
        "
      />

      {/* ==================================================================
          Top row
          ================================================================== */}

      <div className="relative flex items-start justify-between">
        {/* Game icon */}

        <div
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            border
            text-3xl
            shadow-sm
            transition-all
            duration-300
            group-hover:-translate-y-1
            group-hover:scale-105
          "
          style={{
            background: "var(--primary-soft)",
            borderColor: "var(--border)",
          }}
        >
          <span
            aria-hidden="true"
            className="
              transition-transform
              duration-300
              group-hover:scale-110
            "
          >
            {emoji}
          </span>
        </div>

        {/* Arrow */}

        <div
          aria-hidden="true"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            border
            text-sm
            transition-all
            duration-300
            group-hover:translate-x-0.5
          "
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--muted)",
          }}
        >
          →
        </div>
      </div>

      {/* ==================================================================
          Game information
          ================================================================== */}

      <div className="relative mt-6">
        {/* Category badge */}

        <span
          className="
            mb-2
            inline-flex
            items-center
            rounded-full
            border
            px-2.5
            py-1
            text-[11px]
            font-semibold
            uppercase
            tracking-wider
          "
          style={{
            background: "var(--primary-soft)",
            borderColor: "var(--border)",
            color: "var(--primary-dark)",
          }}
        >
          Mini Game
        </span>

        {/* Title */}

        <h2
          className="
            text-xl
            font-bold
            tracking-tight
            transition-colors
            duration-200
          "
          style={{
            color: "var(--foreground)",
          }}
        >
          {title}
        </h2>

        {/* Description */}

        <p
          className="
            mt-2
            min-h-[3rem]
            text-sm
            leading-6
          "
          style={{
            color: "var(--muted)",
          }}
        >
          {description}
        </p>
      </div>

      {/* ==================================================================
          Bottom action
          ================================================================== */}

      <div className="relative mt-7 flex items-center justify-between gap-4">
        <span
          className="
            text-xs
            font-medium
          "
          style={{
            color: "var(--muted)",
          }}
        >
          Ready to play?
        </span>

        <span
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            px-4
            py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition-all
            duration-200
            group-hover:-translate-y-0.5
          "
          style={{
            background: "var(--primary)",
          }}
        >
          Play Now

          <span
            aria-hidden="true"
            className="
              transition-transform
              duration-200
              group-hover:translate-x-0.5
            "
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}