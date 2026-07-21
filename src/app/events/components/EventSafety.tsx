import { formatEventDate } from "../../../lib/events/archive";
import type { ReviewedEventPreview } from "../../../lib/events/types";

export function EventSafety({ event }: { event: ReviewedEventPreview }) {
  const hasIncidents = event.safetyIncidents.length > 0;

  return (
    <section className="event-record-safety" aria-labelledby="event-safety-heading">
      <h2 id="event-safety-heading">Safety and conflict incidents</h2>

      {hasIncidents ? (
        <>
          <dl className="event-safety-summary">
            <div>
              <dt>Assessment</dt>
              <dd>{event.safety.assessment}</dd>
            </div>
            <div>
              <dt>Documented incidents</dt>
              <dd>{event.safety.incidentCount}</dd>
            </div>
            <div>
              <dt>Highest classification</dt>
              <dd>{event.safety.highestClassification}</dd>
            </div>
            <div>
              <dt>Injuries and deaths</dt>
              <dd>{event.safety.injuriesAndDeathsStatus}</dd>
            </div>
            <div>
              <dt>Property damage</dt>
              <dd>{event.safety.propertyDamageStatus}</dd>
            </div>
            <div>
              <dt>Last safety review</dt>
              <dd>{formatEventDate(event.safety.lastReviewed)}</dd>
            </div>
          </dl>
          <p className="event-safety-narrative">{event.safety.summary}</p>
          {event.latestOfficialResponse ? (
            <p className="event-safety-official-response">
              <strong>Latest official response:</strong> {event.latestOfficialResponse}
            </p>
          ) : null}
          <ol className="event-safety-incident-list">
            {event.safetyIncidents.map((incident) => (
              <li className="event-safety-incident" key={`${incident.date}-${incident.category}`}>
                <h3>Incident recorded {formatEventDate(incident.date)}</h3>
                <p>{incident.publicWording}</p>
                <dl>
                  <div>
                    <dt>Broad location</dt>
                    <dd>{incident.publicLocation}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{incident.category}</dd>
                  </div>
                  <div>
                    <dt>Reported actors</dt>
                    <dd>{incident.reportedActors}</dd>
                  </div>
                  <div>
                    <dt>Police or state force</dt>
                    <dd>{incident.policeOrStateForce}</dd>
                  </div>
                  <div>
                    <dt>Protester or other reported force</dt>
                    <dd>{incident.protesterOrOtherForce}</dd>
                  </div>
                  <div>
                    <dt>Injuries</dt>
                    <dd>{incident.injuriesStatus}</dd>
                  </div>
                  <div>
                    <dt>Deaths</dt>
                    <dd>{incident.deathsStatus}</dd>
                  </div>
                  <div>
                    <dt>Property damage</dt>
                    <dd>{incident.propertyDamage}</dd>
                  </div>
                  <div>
                    <dt>Arrests or detentions</dt>
                    <dd>{incident.arrestsOrDetentions}</dd>
                  </div>
                  <div>
                    <dt>Verification</dt>
                    <dd>{incident.verificationStatus}</dd>
                  </div>
                  {incident.competingAccounts ? (
                    <div>
                      <dt>Competing accounts</dt>
                      <dd>{incident.competingAccounts}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="event-safety-no-incidents">{event.safety.summary}</p>
      )}
    </section>
  );
}
