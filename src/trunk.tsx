import * as React from "react";
import type { TrunkItem } from "./types";
import { TaskBall, TrunkCompartment, ballLabel } from "./car";

/**
 * The "trunk" — a cyborg-style compartment holding deferred tasks as 3D
 * balls. Collapsed by default so deferred work doesn't visually crowd the
 * front seat; click the latch to pop it open. Drag a ball into the front
 * seat to promote it; the current MIT drops back into the trunk in exchange.
 *
 * Drop-target detection requires the trunk element to exist in the DOM, so
 * when collapsed we still render a hidden well behind the latch — invisible
 * but hit-testable. Dropping a seat ball onto the closed latch auto-pops it.
 */
export function TrunkStrip({
  items, onPromote, onAdd, onRemove,
  trunkRef, isDropTarget,
  onPointerDownBall, draggingId,
}: {
  items: TrunkItem[];
  onPromote: (id: string) => void;
  onAdd: (title: string) => void;
  onRemove: (id: string) => void;
  trunkRef?: React.RefObject<HTMLDivElement | null>;
  isDropTarget?: boolean;
  onPointerDownBall?: (args: { id: string; label: string; title: string }, e: React.PointerEvent) => void;
  draggingId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [composing, setComposing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  // Auto-pop when a drag enters the closed latch. The parent sets
  // isDropTarget=true when the pointer hovers over the trunk DOM node.
  React.useEffect(() => {
    if (isDropTarget && !open) setOpen(true);
  }, [isDropTarget, open]);

  const submit = () => {
    const t = draft.trim();
    if (t) onAdd(t);
    setDraft("");
    setComposing(false);
  };

  // Collapsed view — a single cyborg latch bar with the count + pop button.
  // We still mount the compartment behind it (hidden) so drop-target hit
  // testing keeps working and the open animation has somewhere to expand to.
  if (!open) {
    return (
      <div className="cc-trunk-latch-wrap">
        <button
          type="button"
          className={"cc-trunk-latch" + (isDropTarget ? " drop-target" : "")}
          onClick={() => setOpen(true)}
          ref={trunkRef as React.RefObject<HTMLButtonElement>}
          title={items.length > 0 ? `Pop trunk — ${items.length} deferred` : "Trunk is empty"}
        >
          <span className="cc-trunk-latch-corner left" aria-hidden="true" />
          <span className="cc-trunk-latch-label">Trunk</span>
          <span className="cc-trunk-latch-count mono tabular">{items.length}</span>
          <span className="cc-trunk-latch-divider" aria-hidden="true" />
          <span className="cc-trunk-latch-action">
            <span className="cc-trunk-latch-glyph" aria-hidden="true">▾</span>
            <span>pop</span>
          </span>
          <span className="cc-trunk-latch-corner right" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <TrunkCompartment
      count={items.length}
      trunkRef={trunkRef}
      isDropTarget={isDropTarget}
      onClose={() => setOpen(false)}
    >
      {items.map((it) => {
        const label = ballLabel({ title: it.title, project: it.project });
        return (
          <div key={it.id} className="cc-trunk-ball-wrap" title={it.title}>
            <TaskBall
              label={label}
              title={it.title}
              size={52}
              tone="default"
              onClick={() => onPromote(it.id)}
              onPointerDown={(e) => onPointerDownBall?.({ id: it.id, label, title: it.title }, e)}
              onRemove={() => onRemove(it.id)}
              dragging={draggingId === it.id}
            />
            <span className="cc-trunk-ball-title">{it.title}</span>
          </div>
        );
      })}

      {composing ? (
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => { if (e.key === "Escape") { setDraft(""); setComposing(false); } }}
            placeholder="What's deferred?"
            className="trunk-compose"
          />
        </form>
      ) : (
        <button
          type="button"
          className="cc-trunk-add-ball"
          onClick={() => setComposing(true)}
          aria-label="Add deferred task"
          title="Add a deferred task to the trunk"
        >
          <span>+</span>
        </button>
      )}
    </TrunkCompartment>
  );
}
