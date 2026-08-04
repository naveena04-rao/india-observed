# Full-scale scanner source review

Reviewed on 2026-08-04. Technical accessibility does not constitute legal approval. All selected
sources are limited to private editorial discovery. No feed, article, image, video or PDF is
republished. Scheduled scanning remains disabled.

## Selected endpoints

All 30 endpoints returned HTTP 200 with parseable RSS metadata during technical review.

| Source                      | Region    | Language | Connector | Endpoint                                                                                                                                                                | Items seen | Selection basis                 |
| --------------------------- | --------- | -------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------: | ------------------------------- |
| Indian Express India        | National  | English  | RSS       | `https://indianexpress.com/section/india/feed/`                                                                                                                         |        200 | National public affairs         |
| Hindustan Times India       | National  | English  | RSS       | `https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml`                                                                                                       |        100 | National public affairs         |
| Times of India India        | National  | English  | RSS       | `https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms`                                                                                                          |         20 | National public affairs         |
| The Hindu National          | National  | English  | RSS       | `https://www.thehindu.com/news/national/feeder/default.rss`                                                                                                             |         60 | National, courts and government |
| News18 India                | National  | English  | RSS       | `https://www.news18.com/commonfeeds/v1/eng/rss/india.xml`                                                                                                               |        200 | National and state reporting    |
| India Civic Query           | National  | English  | Query RSS | `https://news.google.com/rss/search?q=India%20(protest%20OR%20strike%20OR%20dharna%20OR%20blockade)&hl=en-IN&gl=IN&ceid=IN:en`                                          |        100 | Protest-specific metadata only  |
| Indian Express Delhi        | North     | English  | RSS       | `https://indianexpress.com/section/cities/delhi/feed/`                                                                                                                  |        200 | Delhi civic and court reporting |
| Indian Express Chandigarh   | North     | English  | RSS       | `https://indianexpress.com/section/cities/chandigarh/feed/`                                                                                                             |        200 | Punjab, Haryana and Chandigarh  |
| Hindustan Times Lucknow     | North     | English  | RSS       | `https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml`                                                                                              |         41 | Uttar Pradesh reporting         |
| North India Civic Query     | North     | English  | Query RSS | `https://news.google.com/rss/search?q=(Punjab%20OR%20Delhi%20OR%20Uttar%20Pradesh)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en`                   |        100 | Protest-specific metadata only  |
| Indian Express Bengaluru    | South     | English  | RSS       | `https://indianexpress.com/section/cities/bangalore/feed/`                                                                                                              |        200 | Karnataka reporting             |
| Indian Express Hyderabad    | South     | English  | RSS       | `https://indianexpress.com/section/cities/hyderabad/feed/`                                                                                                              |        200 | Telangana reporting             |
| Telangana Today             | South     | English  | RSS       | `https://telanganatoday.com/feed`                                                                                                                                       |        500 | Telangana regional reporting    |
| South India Civic Query     | South     | English  | Query RSS | `https://news.google.com/rss/search?q=(Tamil%20Nadu%20OR%20Karnataka%20OR%20Kerala%20OR%20Telangana)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en` |        100 | Protest-specific metadata only  |
| Indian Express Kolkata      | East      | English  | RSS       | `https://indianexpress.com/section/cities/kolkata/feed/`                                                                                                                |        200 | West Bengal reporting           |
| Indian Express Bhubaneswar  | East      | English  | RSS       | `https://indianexpress.com/section/cities/bhubaneswar/feed/`                                                                                                            |        200 | Odisha reporting                |
| Hindustan Times Patna       | East      | English  | RSS       | `https://www.hindustantimes.com/feeds/rss/cities/patna-news/rssfeed.xml`                                                                                                |          5 | Bihar reporting                 |
| East India Civic Query      | East      | English  | Query RSS | `https://news.google.com/rss/search?q=(Bihar%20OR%20Jharkhand%20OR%20Odisha%20OR%20West%20Bengal)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en`    |        100 | Protest-specific metadata only  |
| Indian Express Mumbai       | West      | English  | RSS       | `https://indianexpress.com/section/cities/mumbai/feed/`                                                                                                                 |        200 | Maharashtra reporting           |
| Indian Express Pune         | West      | English  | RSS       | `https://indianexpress.com/section/cities/pune/feed/`                                                                                                                   |        200 | Maharashtra district reporting  |
| Indian Express Ahmedabad    | West      | English  | RSS       | `https://indianexpress.com/section/cities/ahmedabad/feed/`                                                                                                              |        200 | Gujarat reporting               |
| West India Civic Query      | West      | English  | Query RSS | `https://news.google.com/rss/search?q=(Maharashtra%20OR%20Gujarat%20OR%20Goa)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en`                        |        100 | Protest-specific metadata only  |
| NorthEast Now               | Northeast | English  | RSS       | `https://www.nenow.in/feed`                                                                                                                                             |         10 | Northeast regional reporting    |
| Sentinel Assam              | Northeast | English  | RSS       | `https://www.sentinelassam.com/feed`                                                                                                                                    |         48 | Assam and Northeast reporting   |
| Assam Tribune               | Northeast | English  | RSS       | `https://assamtribune.com/feed`                                                                                                                                         |         74 | Assam and Northeast reporting   |
| Northeast India Civic Query | Northeast | English  | Query RSS | `https://news.google.com/rss/search?q=(Assam%20OR%20Manipur%20OR%20Nagaland%20OR%20Meghalaya)%20(protest%20OR%20strike%20OR%20blockade)&hl=en-IN&gl=IN&ceid=IN:en`      |        100 | Protest-specific metadata only  |
| Indian Express Bhopal       | Central   | English  | RSS       | `https://indianexpress.com/section/cities/bhopal/feed/`                                                                                                                 |        200 | Madhya Pradesh reporting        |
| Hindustan Times Bhopal      | Central   | English  | RSS       | `https://www.hindustantimes.com/feeds/rss/cities/bhopal-news/rssfeed.xml`                                                                                               |          1 | Madhya Pradesh reporting        |
| Madhya Pradesh Information  | Central   | Hindi    | RSS       | `https://mpinfo.org/RSSFeed/RSSFeed_News.xml`                                                                                                                           |          1 | Official response metadata      |
| Central India Civic Query   | Central   | English  | Query RSS | `https://news.google.com/rss/search?q=(Madhya%20Pradesh%20OR%20Chhattisgarh)%20(protest%20OR%20strike%20OR%20dharna)&hl=en-IN&gl=IN&ceid=IN:en`                         |        100 | Protest-specific metadata only  |

Query feeds are never eligible for article enrichment. Publisher enrichment is separately gated by
the reviewed source record, same-domain checks, public access, bounded response size, per-domain
limits and the fetch safety layer. Only a short relevant excerpt may be retained privately.

## Other evaluated endpoints

Thirty-seven additional endpoints were evaluated and not selected. Responsive but redundant feeds
included Indian Express Politics, Education, Lucknow, Jaipur, Chennai, Patna, Guwahati and
Northeast; Hindustan Times Delhi, Chandigarh, Jaipur, Dehradun, Bengaluru, Chennai, Hyderabad,
Kochi, Kolkata, Ranchi, Mumbai, Pune and Indore; The Hindu States; Business Standard India; and the
NorthEast Now news sitemap. They were excluded to preserve the 30-source bound and regional
balance.

Technical failures or unsuitable responses were: Indian Express Kochi (404), Indian Express Ranchi
(404), Scroll India feed path (HTML rather than RSS), The Wire feed path (HTML rather than RSS), PIB
English candidate endpoint (404), Onmanorama Kerala candidate endpoint (404), New Indian Express
candidate endpoint (404), Nagaland Post (network failure), Times of India news sitemap (403), The
Hindu news sitemap (404), and EastMojo (previous Production private-address resolution safety
failure). Indian Express and Hindustan Times news sitemaps were parseable but excluded because the
current daily connector does not traverse sitemap indexes during a bounded run.
