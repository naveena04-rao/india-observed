import type {
  EditorialIllustrationVisual,
  EventType,
  PrimaryTopic,
} from "../../../lib/events/types";
import type { CSSProperties } from "react";

const topicPalette: Record<PrimaryTopic, { accent: string; field: string; line: string }> = {
  "Land & rehabilitation": { accent: "#e14a2b", field: "#f2d6cc", line: "#67291e" },
  Education: { accent: "#174e57", field: "#d4e4e5", line: "#133b42" },
  "Agriculture & water": { accent: "#2d6650", field: "#dce7d8", line: "#173e31" },
  "Trade & economic policy": { accent: "#9b4a28", field: "#ead9cc", line: "#55301f" },
  Environment: { accent: "#39724f", field: "#d7e4d8", line: "#244731" },
  "Labour & employment": { accent: "#9d3024", field: "#ead5d1", line: "#57231d" },
  "Civil rights & justice": { accent: "#4d4a76", field: "#dddcea", line: "#302e52" },
  "Governance & transparency": { accent: "#305d6c", field: "#d5e1e5", line: "#203f48" },
  "Infrastructure & public services": {
    accent: "#6b5741",
    field: "#e4ddd3",
    line: "#403425",
  },
};

function stableSeed(value: string) {
  return [...value].reduce((hash, character) => {
    return Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  }, 2166136261);
}

function variation(seed: number, salt: number, minimum: number, span: number) {
  const mixed = Math.imul(seed ^ (salt * 2654435761), 2246822519) >>> 0;
  return minimum + (mixed % span);
}

function splitTitle(title: string) {
  const words = title.split(/\s+/);
  const lines = [""];

  for (const word of words) {
    const current = lines.at(-1) ?? "";
    if (`${current} ${word}`.trim().length <= 18 || lines.length === 3) {
      lines[lines.length - 1] = `${current} ${word}`.trim();
    } else {
      lines.push(word);
    }
  }

  if ((lines[2]?.length ?? 0) > 20) lines[2] = `${lines[2]!.slice(0, 19).trim()}…`;
  return lines.slice(0, 3);
}

function MovementMotif({ eventType, seed }: { eventType: EventType; seed: number }) {
  if (eventType === "March" || eventType === "Rally") {
    return (
      <g className="illustration-motif" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => {
          const offset = variation(seed, index, 0, 22);
          return (
            <path
              d={`M ${20 + offset} ${48 + index * 27} C ${82 + offset} ${24 + index * 30}, ${132 + offset} ${76 + index * 18}, ${202 + offset} ${46 + index * 28}`}
              key={index}
            />
          );
        })}
      </g>
    );
  }

  if (eventType === "Sit-in" || eventType === "Sit-in / Dharna" || eventType === "Hunger strike") {
    const centreX = variation(seed, 7, 94, 50);
    const centreY = variation(seed, 8, 78, 34);
    return (
      <g className="illustration-motif" aria-hidden="true">
        {[28, 46, 66, 88].map((radius) => (
          <ellipse cx={centreX} cy={centreY} key={radius} rx={radius} ry={radius * 0.48} />
        ))}
      </g>
    );
  }

  if (eventType === "Strike" || eventType === "Shutdown") {
    return (
      <g className="illustration-motif" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const breakPoint = variation(seed, index + 12, 72, 62);
          const y = 38 + index * 26;
          return (
            <g key={index}>
              <line x1="18" x2={breakPoint} y1={y} y2={y} />
              <line x1={breakPoint + 24} x2="226" y1={y} y2={y} />
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <g className="illustration-motif" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const x = variation(seed, index + 20, 18, 172);
        const height = variation(seed, index + 30, 54, 92);
        return <rect height={height} key={index} width="17" x={x} y={178 - height} />;
      })}
    </g>
  );
}

function TopicPattern({ primaryTopic, seed }: { primaryTopic: PrimaryTopic; seed: number }) {
  if (primaryTopic === "Environment" || primaryTopic === "Agriculture & water") {
    return (
      <g className="illustration-topic-pattern" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => {
          const y = 24 + index * 33 + variation(seed, index + 41, 0, 12);
          return <path d={`M 0 ${y} Q 62 ${y - 24}, 122 ${y} T 244 ${y}`} key={index} />;
        })}
      </g>
    );
  }

  if (
    primaryTopic === "Land & rehabilitation" ||
    primaryTopic === "Infrastructure & public services"
  ) {
    return (
      <g className="illustration-topic-pattern" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => {
          const x = variation(seed, index + 50, 8, 178);
          const y = variation(seed, index + 60, 12, 120);
          return <rect height={52 + index * 7} key={index} width={74 - index * 5} x={x} y={y} />;
        })}
      </g>
    );
  }

  return (
    <g className="illustration-topic-pattern" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((index) => {
        const x = variation(seed, index + 70, 12, 210);
        const y = variation(seed, index + 80, 12, 154);
        return <circle cx={x} cy={y} key={index} r={6 + (index % 3) * 4} />;
      })}
    </g>
  );
}

export function EventEditorialIllustration({ visual }: { visual: EditorialIllustrationVisual }) {
  const seed = stableSeed(visual.slug);
  const palette = topicPalette[visual.primaryTopic];
  const titleLines = splitTitle(visual.title);

  return (
    <div
      className="event-editorial-illustration"
      role="img"
      aria-label={visual.alt}
      style={
        {
          "--illustration-accent": palette.accent,
          "--illustration-field": palette.field,
          "--illustration-line": palette.line,
        } as CSSProperties
      }
    >
      <svg viewBox="0 0 420 236" aria-hidden="true" focusable="false">
        <rect className="illustration-field" height="236" width="420" />
        <g
          transform={`translate(${variation(seed, 90, -10, 24)} 8) rotate(${variation(seed, 91, -4, 9)} 122 100)`}
        >
          <TopicPattern primaryTopic={visual.primaryTopic} seed={seed} />
          <MovementMotif eventType={visual.eventType} seed={seed} />
        </g>
        <rect className="illustration-panel" height="198" width="158" x="244" y="19" />
        <line className="illustration-rule" x1="264" x2="382" y1="48" y2="48" />
        <text className="illustration-brand" x="264" y="38">
          INDIA OBSERVED
        </text>
        <text className="illustration-title" x="264" y="82">
          {titleLines.map((line, index) => (
            <tspan dy={index === 0 ? 0 : 18} key={line} x="264">
              {line}
            </tspan>
          ))}
        </text>
        <text className="illustration-location" x="264" y="158">
          {visual.location.length > 23
            ? `${visual.location.slice(0, 22).trim()}…`
            : visual.location}
        </text>
        <text className="illustration-status" x="264" y="188">
          {visual.dateLabel.toUpperCase()}
        </text>
        <circle className="illustration-status-marker" cx="378" cy="186" r="7" />
      </svg>
    </div>
  );
}
