# ADR-007: Video Provider — Mux

## Status
Accepted

## Context
Need video ingestion, transcoding, and HLS streaming for short educational videos (15s–3min).

## Decision
Use **Mux** (managed) for MVP. Plan migration to self-hosted FFmpeg workers post-traction.

### Rationale
- Buy speed in MVP: Mux handles ingest, transcoding, multi-resolution HLS, thumbnails
- Auto-captions via Whisper (supplemented by our own worker for quality)
- CDN-backed delivery with adaptive bitrate
- Self-hosted migration when economics demand (>50K videos, >$X/mo Mux cost)

## Consequences
- Mux costs scale with usage (ingest + storage + streaming minutes)
- Must implement Mux webhook handler for asset status updates
- Video metadata in our DB, files on Mux
