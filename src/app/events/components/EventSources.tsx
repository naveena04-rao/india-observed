import { formatEventDate } from "../../../lib/events/archive";
import type { EventPublicSource, EventSourceRole } from "../../../lib/events/types";

const readerFacingRole: Record<EventSourceRole, string> = {
  "Official response": "Official source",
  "Official context": "Official source",
  Corroboration: "Independent reporting",
  "Follow-up": "Follow-up",
  Lead: "Discovery lead",
  "Historical context": "Historical context",
  "Alternate access": "Alternate access",
};

export function EventSources({ sources }: { sources: readonly EventPublicSource[] }) {
  return (
    <section
      className="event-record-sources"
      id="event-sources"
      aria-labelledby="event-sources-heading"
    >
      <h2 id="event-sources-heading">Sources</h2>
      <ol className="event-source-list">
        {sources.map((source) => (
          <li className="event-source-entry" key={`${source.url}-${source.headline}`}>
            <span className="event-source-role">{readerFacingRole[source.sourceRole]}</span>
            <h3>{source.headline}</h3>
            <p className="event-source-publisher">{source.publisher}</p>
            <p className="event-source-details">
              {source.publicationDate ? formatEventDate(source.publicationDate) : "Date not listed"}
              <span aria-hidden="true"> · </span>
              {source.sourceType}
              {source.reporter ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {source.reporter}
                </>
              ) : null}
            </p>
            {source.independenceNote ? (
              <p className="event-source-independence">{source.independenceNote}</p>
            ) : null}
            <a href={source.url} target="_blank" rel="noreferrer noopener">
              Open original source
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
