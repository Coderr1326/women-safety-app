# Hardware Integration (Private)

This directory contains the embedded/hardware integration layer of the project.

> ⚠️ **Note:** The specific hardware design, communication protocol, and
> implementation details are intentionally **not published** — this part of
> the system is proprietary and under evaluation for intellectual-property
> protection. It is kept in a **private repository**.

## What it does (high level)

A low-power, long-range **offline communication link** that can relay an SOS
and the user's GPS position to emergency contacts **without any cellular or
internet connectivity** — designed for wilderness, disaster, and
no-network scenarios.

- Reads the latest GPS position from the relay server (`GET /api/location`)
- Detects an SOS trigger from a remote transmitter
- Sends SMS alerts (with a Google Maps link) to pre-registered contacts
  via Twilio, over the available uplink

## Interface contract (public)

The hardware layer talks to the relay server exclusively over two HTTP
endpoints:

| Method | Endpoint           | Purpose                          |
|--------|--------------------|----------------------------------|
| GET    | `/api/location`    | Read latest app GPS position     |
| POST   | `/send-sms`        | Send an SMS via Twilio           |

Anyone can build a compatible client against this contract.
