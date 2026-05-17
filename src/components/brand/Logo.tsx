// BizInsight wordmark — inline SVG so no external image request, no lint warnings,
// and server-side rendering works without a flash. Scale with Tailwind h-* classes.
//
// "Biz" = #FFFFFF  |  "Insight" = #FBBF24 (amber-400)
// Font: system-ui stack — renders correctly on all platforms at any scale.

export default function Logo({
  className = "h-6",
}: {
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 186 36"
      aria-label="BizInsight"
      role="img"
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      <text
        y="28"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
        fontSize="26"
        fontWeight="700"
        letterSpacing="-0.4"
      >
        <tspan fill="#FFFFFF">Biz</tspan>
        <tspan fill="#FBBF24">Insight</tspan>
      </text>
    </svg>
  )
}
