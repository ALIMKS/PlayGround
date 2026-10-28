import { MapPin, Navigation } from "lucide-react";
import type { Listing } from "../types";
import { eur } from "../lib/format";

const PIN_SLOTS = [
  [17, 27],
  [39, 19],
  [64, 28],
  [80, 21],
  [27, 43],
  [49, 40],
  [72, 46],
  [19, 61],
  [43, 60],
  [67, 62],
  [33, 77],
  [57, 79],
  [81, 71],
  [11, 49],
  [87, 44],
  [51, 11],
  [24, 88],
  [73, 87],
];

function positionFor(index: number): [number, number] {
  return PIN_SLOTS[index % PIN_SLOTS.length] as [number, number];
}

interface MapPanelProps {
  listings: Listing[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  mode?: "search" | "detail";
  city?: string;
}

export function MapPanel({ listings, activeId, onSelect, mode = "search", city }: MapPanelProps) {
  return (
    <div className={`map-panel map-panel--${mode}`} aria-label="Carte des logements">
      <svg
        className="map-art"
        viewBox="0 0 600 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect width="600" height="720" fill="#EDE7DA" />
        <path
          d="M0 0H210C228 78 190 132 128 186C74 234 66 306 22 356L0 378Z"
          fill="#CBDDDA"
        />
        <path
          d="M600 720H360C372 650 412 604 470 560C520 522 556 480 600 462Z"
          fill="#CBDDDA"
        />
        <path
          d="M168 720C196 640 176 574 232 512C288 450 268 392 322 330"
          fill="none"
          stroke="#CBDDDA"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <ellipse cx="360" cy="168" rx="104" ry="66" fill="#DAE3CE" />
        <ellipse cx="486" cy="348" rx="74" ry="54" fill="#DAE3CE" />
        <ellipse cx="196" cy="584" rx="88" ry="60" fill="#DAE3CE" />
        <g fill="#E3DCCB">
          <rect x="300" y="500" width="70" height="46" rx="8" />
          <rect x="424" y="96" width="62" height="44" rx="8" />
          <rect x="96" y="300" width="54" height="40" rx="8" />
          <rect x="392" y="596" width="58" height="42" rx="8" />
        </g>
        <g stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity="0.92" fill="none">
          <path d="M-20 250C120 236 214 276 316 248C418 220 500 168 630 190" />
          <path d="M120 740C160 620 210 560 268 496C326 432 372 372 392 280" />
          <path d="M620 540C520 528 452 548 380 590C308 632 250 660 200 740" />
        </g>
        <g stroke="#E0D8C7" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M40 470C150 452 236 486 320 468C404 450 470 410 560 420" />
          <path d="M300 40C310 130 290 196 300 260C310 324 350 372 356 440" />
          <path d="M460 250C420 320 400 380 412 470" />
          <path d="M80 620C160 600 220 612 300 596" />
          <path d="M500 620C520 560 540 520 580 496" />
        </g>
        <g fill="#A9A395" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="2.4">
          <text x="52" y="222">LE PORT</text>
          <text x="398" y="176">LES HAUTEURS</text>
          <text x="352" y="556">LE CENTRE</text>
          <text x="446" y="672">LA PLAGE</text>
        </g>
      </svg>

      {mode === "search" ? (
        <div className="map-pins">
          {listings.map((listing, index) => {
            const [left, top] = positionFor(index);
            return (
              <button
                type="button"
                key={listing.id}
                className={`map-pin${activeId === listing.id ? " is-active" : ""}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                onClick={() => onSelect?.(listing.id)}
                aria-label={`${listing.title} — ${eur(listing.pricePerNight)} par nuit`}
              >
                {eur(listing.pricePerNight)}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="map-detail-pin">
          <span className="map-ring" />
          <span className="map-dot">
            <MapPin size={18} />
          </span>
          <span className="map-detail-label">{city}</span>
        </div>
      )}

      <div className="map-caption">
        <Navigation size={13} />
        {mode === "search" ? `${listings.length} logements · carte illustrative` : "Quartier"}
      </div>
    </div>
  );
}
