import * as React from "react";
import type { TrunkItem } from "./types";
import { TaskBall, TrunkCompartment, ballLabel } from "./car";

/**
 * The "trunk" — an open car-trunk compartment holding deferred tasks as 3D
 * balls. Click or drag a ball to promote it to the Front Seat (the MIT
 * banner); the current MIT ball drops down here in exchange.
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
  const [composing, setComposing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const submit = () => {
    const t = draft.trim();
    if (t) onAdd(t);
    setDraft("");
    setComposing(false);
  };

  return (
    <TrunkCompartment count={items.length} trunkRef={trunkRef} isDropTarget={isDropTarget}>
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
