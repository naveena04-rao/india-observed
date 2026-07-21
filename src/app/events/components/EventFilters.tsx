import Link from "next/link";
import type { ArchiveFilters } from "../../../lib/events/types";

type FilterOptions = {
  states: readonly string[];
  topics: readonly string[];
  eventTypes: readonly string[];
  statuses: readonly string[];
};

export function EventFilters({
  filters,
  options,
}: {
  filters: ArchiveFilters;
  options: FilterOptions;
}) {
  const hasFilters = Boolean(
    filters.query || filters.state || filters.topic || filters.eventType || filters.status,
  );

  return (
    <form className="event-filters" action="/events" method="get">
      <div className="event-filter-search">
        <label htmlFor="events-query">Search reviewed records</label>
        <input
          id="events-query"
          name="q"
          type="search"
          defaultValue={filters.query}
          placeholder="Title, place, topic or authority"
        />
      </div>

      <div>
        <label htmlFor="events-state">State / Union Territory</label>
        <select id="events-state" name="state" defaultValue={filters.state}>
          <option value="">All states and UTs</option>
          {options.states.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="events-topic">Topic</label>
        <select id="events-topic" name="topic" defaultValue={filters.topic}>
          <option value="">All topics</option>
          {options.topics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="events-type">Event type</label>
        <select id="events-type" name="type" defaultValue={filters.eventType}>
          <option value="">All event types</option>
          {options.eventTypes.map((eventType) => (
            <option key={eventType}>{eventType}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="events-status">Status</label>
        <select id="events-status" name="status" defaultValue={filters.status}>
          <option value="">All statuses</option>
          {options.statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="events-sort">Sort</label>
        <select id="events-sort" name="sort" defaultValue={filters.sort}>
          <option value="latest">Latest activity</option>
          <option value="reviewed">Recently reviewed</option>
          <option value="oldest">Event date: oldest first</option>
        </select>
      </div>

      <div className="event-filter-actions">
        <button type="submit">Apply</button>
        {hasFilters || filters.sort !== "latest" ? <Link href="/events">Reset</Link> : null}
      </div>
    </form>
  );
}
