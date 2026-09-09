"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Address entry with district and city assistance.
 *
 * Deliberately assistive, not restrictive. Picking a suggestion fills in the
 * district and postal code, but every field stays free text — the postal data
 * behind the suggestions is missing real towns (Negombo among them), so a
 * shopper must always be able to type an address it has never heard of.
 */

export interface AddressDraft {
  line1: string;
  line2: string;
  city: string;
  district: string;
  postalCode: string;
}

interface CityMatch {
  city: string;
  district: string;
  province: string;
  postalCode: string;
}

interface Props {
  value: AddressDraft;
  onChange: (next: AddressDraft) => void;
  districts: string[];
  /** Wraps each field; lets the account form and checkout keep their own markup. */
  fieldClassName?: string;
  wideClassName?: string;
}

export function AddressFields({ value, onChange, districts, fieldClassName, wideClassName }: Props) {
  const [matches, setMatches] = useState<CityMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  // Set while a suggestion is being applied, so the resulting value change does
  // not immediately reopen the list.
  const applying = useRef(false);

  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });

  // Debounced so a fast typist makes one request, not one per keystroke.
  useEffect(() => {
    if (applying.current) {
      applying.current = false;
      return;
    }
    const term = value.city.trim();
    if (term.length < 2) {
      setMatches([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: term });
        if (value.district) params.set("district", value.district);
        const res = await fetch(`/api/address?${params}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        setMatches(data.matches ?? []);
        setActive(-1);
      } catch {
        /* aborted or offline — the field still works as free text */
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value.city, value.district]);

  // Clicking away closes the list without choosing anything.
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const choose = (match: CityMatch) => {
    applying.current = true;
    onChange({
      ...value,
      city: match.city,
      district: match.district,
      // Never overwrite a postal code the shopper typed themselves.
      postalCode: value.postalCode.trim() || match.postalCode,
    });
    setOpen(false);
    setMatches([]);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open || matches.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? matches.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(matches[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && matches.length > 0;

  return (
    <>
      <label className={wideClassName}>
        <span>Address line 1</span>
        <input
          value={value.line1}
          onChange={(e) => set({ line1: e.target.value })}
          autoComplete="address-line1"
        />
      </label>

      <label className={wideClassName}>
        <span>Address line 2 (optional)</span>
        <input
          value={value.line2}
          onChange={(e) => set({ line2: e.target.value })}
          autoComplete="address-line2"
        />
      </label>

      <label className={fieldClassName}>
        <span>District</span>
        <select value={value.district} onChange={(e) => set({ district: e.target.value })}>
          <option value="">Select a district</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>

      <label className={fieldClassName} style={{ position: "relative" }}>
        <span>City / town</span>
        <div ref={boxRef} className="city-combo">
          <input
            value={value.city}
            onChange={(e) => {
              set({ city: e.target.value });
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoComplete="address-level2"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            aria-controls="city-suggestions"
          />
          {showList && (
            <ul className="city-suggestions" id="city-suggestions" role="listbox">
              {matches.map((match, index) => (
                <li key={`${match.city}-${match.postalCode}`} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    data-active={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(match)}
                  >
                    <b>{match.city}</b>
                    <small>
                      {match.district} · {match.postalCode}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>

      <label className={fieldClassName}>
        <span>Postal code (optional)</span>
        <input
          value={value.postalCode}
          onChange={(e) => set({ postalCode: e.target.value })}
          autoComplete="postal-code"
          inputMode="numeric"
        />
      </label>
    </>
  );
}
