// Decorative page background: a fading grid and three slowly drifting color glows.
// It sits behind the page (-z-10), so the page's wrapper needs the "isolate" class.
export default function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="octo-grid absolute inset-0" />
      <div className="octo-blob -left-32 -top-40 size-[28rem] bg-violet-600" />
      <div className="octo-blob -right-40 top-20 size-[26rem] bg-cyan-500" style={{ animationDelay: "-6s" }} />
      <div className="octo-blob bottom-[-12rem] left-1/3 size-[24rem] bg-fuchsia-500" style={{ animationDelay: "-11s" }} />
    </div>
  );
}
