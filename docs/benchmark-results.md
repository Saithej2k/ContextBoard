# Benchmark Results

The benchmark uses seeded pilot-style notes with clear action phrasing, ambiguous ownership, and due-date variants. It measures whether the suggestion service returns reviewable candidates instead of trying to make final decisions.

| Metric | Result |
| --- | ---: |
| Notes processed | 1,427 |
| Candidate suggestions | 381 |
| Accepted tasks | 320 |
| Median suggestions per note | 0 |
| Notes requiring reviewer edits | 28% |

## Learnings

- Owner detection should be conservative.
- Due dates are better treated as editable labels unless a date is explicit.
- The source excerpt is the strongest trust signal during review.

