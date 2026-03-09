# Map System

Mapa je glavna funkcionalnost sajta.

Za MVP koristi se statički JSON.

Primer:

data/police.json

[
 {
  "lat": 43.3209,
  "lng": 21.8958,
  "type": "police"
 },
 {
  "lat": 43.3210,
  "lng": 21.9000,
  "type": "camera"
 }
]

---

# Marker types

police
camera
control
incident

---

# Future version

Mapa će koristiti API endpoint

GET /reports

Response

[
 {
  id
  type
  lat
  lng
  createdAt
 }
]