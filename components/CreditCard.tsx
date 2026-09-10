export default function CreditCard() {
  return (
    <div
      className="
        group
        relative
        inline-flex
        items-center
        gap-2.5
        overflow-hidden
        rounded-2xl
        border
        border-teal-300/40
        bg-gradient-to-r
        from-teal-400/10
        via-cyan-400/10
        to-blue-500/10
        px-5
        py-3
        shadow-[0_8px_30px_rgba(11,180,170,0.08)]
        backdrop-blur-xl
        transition-all
        duration-300


        hover:-translate-y-0.5
        hover:border-teal-400/60
        hover:from-teal-400/15
        hover:via-cyan-400/10
        hover:to-blue-500/15
        hover:shadow-[0_12px_35px_rgba(11,180,170,0.15)]

      "
      style={{
        background:
          "linear-gradient(110deg, rgba(20, 184, 166, 0.10), rgba(6, 182, 212, 0.08), rgba(59, 130, 246, 0.10))",
        borderColor: "rgba(20, 184, 166, 0.30)",
        boxShadow: "0 8px 30px rgba(20, 184, 166, 0.08)",
      }}
    >
      {/* Subtle hover glow */}
     <span
       aria-hidden="true"
       className="
         pointer-events-none
         absolute
         -inset-10
         bg-gradient-to-r
         from-teal-400/10
         via-cyan-400/5
         to-blue-500/10
         opacity-0
         blur-2xl
         transition-opacity
         duration-500
         group-hover:opacity-100
       "
     />


      {/* --------------------------------------------------------------------
         Credit — Name
         -------------------------------------------------------------------- */}

      <span
        className="
          relative
          font-semibold
          tracking-tight
        "
        style={{
          color: "var(--foreground)",
        }}
      >
        Mohammad Salman
      </span>

      {/* --------------------------------------------------------------------
         Separator
         -------------------------------------------------------------------- */}

      <span
        aria-hidden="true"
        className="relative font-semibold"
        style={{
          color: "var(--primary)",
        }}
      >
        ·
      </span>

      {/* --------------------------------------------------------------------
         Credit — Roll
         -------------------------------------------------------------------- */}

      <span
        className="relative font-medium"
        style={{
          color: "var(--muted)",
        }}
      >
        Roll: 741738
      </span>

      {/* --------------------------------------------------------------------
         Separator
         -------------------------------------------------------------------- */}

      <span
        aria-hidden="true"
        className="relative font-semibold"
        style={{
          color: "#06b6d4",
        }}
      >
        ·
      </span>

      {/* --------------------------------------------------------------------
         Credit — Department
         -------------------------------------------------------------------- */}

      <span
        className="relative font-medium"
        style={{
          color: "var(--muted)",
        }}
      >
        Computer Science Technology
      </span>
    </div>
  );
}