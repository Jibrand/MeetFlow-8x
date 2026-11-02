import * as React from 'react';
import { X } from 'lucide-react';

export interface ParticipantInput {
  name: string;
  email?: string;
  role?: string;
}
export function ParticipantChips({
  value,
  onChange,
  disabled,
  id = 'participants',
}: {
  value: ParticipantInput[];
  onChange: (value: ParticipantInput[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [draft, setDraft] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const commit = () => {
    const name = draft.trim().replace(/\s+/g, ' ');
    if (!name) return;
    if (name.length > 100) {
      setNotice('Use 100 characters or fewer for a participant.');
      return;
    }
    if (value.length >= 200) {
      setNotice('A meeting can have up to 200 participants.');
      return;
    }
    const normalized = name.toLocaleLowerCase();
    if (
      value.some(
        (participant) =>
          participant.name.trim().toLocaleLowerCase() === normalized ||
          participant.email?.toLocaleLowerCase() === normalized,
      )
    ) {
      setNotice(`${name} is already added.`);
      setDraft('');
      return;
    }
    onChange([
      ...value,
      {
        name,
        ...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(name) ? { email: name } : {}),
      },
    ]);
    setDraft('');
    setNotice(`${name} added.`);
  };
  const remove = (index: number) => {
    setNotice(`${value[index].name} removed.`);
    onChange(value.filter((_, position) => position !== index));
  };
  return (
    <div className="space-y-1.5">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
        <ul aria-label="Added participants" className="contents">
          {value.map((participant, index) => (
            <li
              key={`${participant.name}-${index}`}
              className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 text-xs"
            >
              <span>{participant.name}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={`Remove ${participant.name}`}
                className="rounded p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value);
            setNotice('');
          }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (
              event.key === 'Enter' ||
              (event.key === 'Tab' && draft.trim())
            ) {
              if (event.key === 'Enter') event.preventDefault();
              commit();
            }
            if (event.key === 'Backspace' && !draft && value.length) {
              event.preventDefault();
              remove(value.length - 1);
            }
          }}
          placeholder={value.length ? 'Add another…' : 'Add a name or email…'}
          aria-describedby={`${id}-help`}
          className="min-w-32 flex-1 bg-transparent py-0.5 text-xs outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
      </div>
      <p id={`${id}-help`} className="text-[11px] text-muted-foreground">
        Enter to add. Backspace or × to remove.
      </p>
      <p
        role="status"
        className="text-[11px] text-muted-foreground"
        aria-live="polite"
      >
        {notice}
      </p>
    </div>
  );
}
