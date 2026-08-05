# India-wide scanner source review

Reviewed 4 August 2026 against the 165 retained source relationships. The inventory contains 50
distinct source domains; 29 publisher- or authority-provided metadata endpoints were tested. Every
test was limited to the feed or sitemap response. No article page, paywall, media, social platform,
browser automation, or full body was fetched.

The selected feeds are for one controlled private editorial metadata run. Titles, canonical links,
timestamps, publisher names, short feed-provided summaries, and duplicate fingerprints are the only
retained source data. Technical accessibility does not grant article-reuse or public-display rights.

| Source                        | Region          | Connector     | Endpoint                                                                   | HTTP | Items in feed | Previous 72h | Decision | Reason                                                                        |
| ----------------------------- | --------------- | ------------- | -------------------------------------------------------------------------- | ---: | ------------: | -----------: | -------- | ----------------------------------------------------------------------------- |
| Indian Express India          | National        | RSS           | `https://indianexpress.com/section/india/feed/`                            |  200 |           200 |           55 | Selected | Current official India feed from a reviewed source domain.                    |
| Hindustan Times India         | National        | RSS           | `https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml`          |  200 |           100 |          100 | Selected | Current official India feed from a reviewed source domain.                    |
| Times of India India          | National        | RSS           | `https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms`             |  200 |            20 |           20 | Selected | Current official India feed from a reviewed source domain.                    |
| Free Press Journal            | National / West | RSS candidate | `https://www.freepressjournal.in/feed`                                     |  200 |             0 |            0 | Rejected | Response is HTML, not a usable feed.                                          |
| Live Hindustan National       | National        | RSS           | `https://api.livehindustan.com/feeds/rss/national/rssfeed.xml`             |  200 |            50 |           49 | Rejected | API host robots policy disallows automated access.                            |
| Indian Express Delhi          | North           | RSS           | `https://indianexpress.com/section/cities/delhi/feed/`                     |  200 |           200 |           29 | Selected | Current city feed; Delhi and northern civic coverage.                         |
| Indian Express Chandigarh     | North           | RSS           | `https://indianexpress.com/section/cities/chandigarh/feed/`                |  200 |           200 |           15 | Rejected | Working but redundant after the 14-source geographic set was balanced.        |
| Hindustan Times Lucknow       | North           | RSS           | `https://www.hindustantimes.com/feeds/rss/cities/lucknow-news/rssfeed.xml` |  200 |            40 |           40 | Selected | Current Uttar Pradesh city feed.                                              |
| Indian Express Chennai        | South           | RSS           | `https://indianexpress.com/section/cities/chennai/feed/`                   |  200 |           200 |            0 | Rejected | Feed is valid but contains no item in the controlled window.                  |
| Indian Express Bengaluru      | South           | RSS           | `https://indianexpress.com/section/cities/bangalore/feed/`                 |  200 |           200 |           11 | Selected | Current Karnataka city feed.                                                  |
| Telangana Today               | South           | RSS           | `https://telanganatoday.com/feed`                                          |  200 |           499 |          469 | Selected | Current regional feed already used by the controlled scanner.                 |
| Onmanorama Kerala             | South           | RSS candidate | `https://www.onmanorama.com/news/kerala.rss.xml`                           |  404 |             0 |            0 | Rejected | Endpoint is no longer available.                                              |
| Indian Express Kolkata        | East            | RSS           | `https://indianexpress.com/section/cities/kolkata/feed/`                   |  200 |           200 |           14 | Selected | Current West Bengal city feed.                                                |
| Indian Express Bhubaneswar    | East            | RSS           | `https://indianexpress.com/section/cities/bhubaneswar/feed/`               |  200 |           200 |            0 | Rejected | Feed is valid but contains no item in the controlled window.                  |
| Hindustan Times Patna         | East            | RSS           | `https://www.hindustantimes.com/feeds/rss/cities/patna-news/rssfeed.xml`   |  200 |             5 |            5 | Selected | Current Bihar city feed.                                                      |
| Indian Express Mumbai         | West            | RSS           | `https://indianexpress.com/section/cities/mumbai/feed/`                    |  200 |           200 |           25 | Selected | Current Maharashtra city feed.                                                |
| Indian Express Ahmedabad      | West            | RSS           | `https://indianexpress.com/section/cities/ahmedabad/feed/`                 |  200 |           200 |           22 | Selected | Current Gujarat city feed.                                                    |
| The Goan                      | West            | RSS candidate | `https://www.thegoan.net/feed`                                             |  200 |             0 |            0 | Rejected | Response is HTML, not a usable feed.                                          |
| NorthEast Now                 | Northeast       | RSS           | `https://www.nenow.in/feed`                                                |  200 |            10 |           10 | Selected | Current regional feed already used by the controlled scanner.                 |
| EastMojo                      | Northeast       | RSS           | `https://eastmojo.com/feed/`                                               |  200 |            10 |           10 | Selected | Current Northeast regional feed from a reviewed source domain.                |
| Indian Express Guwahati       | Northeast       | RSS           | `https://indianexpress.com/section/cities/guwahati/feed/`                  |  200 |           200 |            0 | Rejected | Feed is valid but contains no item in the controlled window.                  |
| Indian Express North East     | Northeast       | RSS           | `https://indianexpress.com/section/north-east-india/feed/`                 |  200 |           200 |            0 | Rejected | Feed is valid but contains no item in the controlled window.                  |
| Indian Express Bhopal         | Central         | RSS           | `https://indianexpress.com/section/cities/bhopal/feed/`                    |  200 |           200 |            0 | Rejected | Feed is valid but contains no item in the controlled window.                  |
| Hindustan Times Bhopal        | Central         | RSS           | `https://www.hindustantimes.com/feeds/rss/cities/bhopal-news/rssfeed.xml`  |  200 |             0 |            0 | Rejected | Valid but empty feed.                                                         |
| Free Press Journal Bhopal     | Central         | RSS candidate | `https://www.freepressjournal.in/bhopal/feed`                              |  200 |             0 |            0 | Rejected | Response is HTML, not a usable feed.                                          |
| Free Press Journal Indore     | Central / West  | RSS candidate | `https://www.freepressjournal.in/indore/feed`                              |  200 |             0 |            0 | Rejected | Response is HTML, not a usable feed.                                          |
| Live Hindustan Madhya Pradesh | Central         | RSS           | `https://api.livehindustan.com/feeds/rss/madhya-pradesh/rssfeed.xml`       |  200 |            50 |           35 | Rejected | API host robots policy disallows automated access.                            |
| Live Hindustan Chhattisgarh   | Central         | RSS           | `https://api.livehindustan.com/feeds/rss/chhattisgarh/rssfeed.xml`         |  200 |            50 |            4 | Rejected | API host robots policy disallows automated access.                            |
| Madhya Pradesh Information    | Central         | RSS           | `https://mpinfo.org/RSSFeed/RSSFeed_News.xml`                              |  200 |            20 |           20 | Selected | Official public feed; Hindi entity and date normalization is handled locally. |

## Selected coverage

- National: 3
- North: 2
- South: 2
- East: 2
- West: 2
- Northeast: 2
- Central India: 1
- Total: 14

All selected hosts returned HTTP 200 feed metadata, require no login or paywall, and had no robots
rule prohibiting the selected feed path. Each source is limited to one normal request per controlled
run, with one conditional retry only after a temporary network failure.
