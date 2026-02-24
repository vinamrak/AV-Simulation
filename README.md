# Ethical Algorithm Simulator for Autonomous Vehicles

A decision-engine demo that simulates how different ethical frameworks affect crash outcomes, liability, and public reaction. No backend — runs entirely in the browser.

## How to run

1. Open `index.html` in a browser (double-click or **File → Open**).
2. Or serve the folder locally, e.g.:
   ```bash
   npx serve .
   ```
   Then open the URL shown (e.g. `http://localhost:3000`).

## Flow

1. **Scenario Setup** — Fixed scenario: 60 km/h, 20% brake failure, 1 pedestrian, 2 passengers, sudden obstacle.
2. **Ethical Mode Selection** — Choose **Utilitarian**, **Passenger Priority**, or **Pedestrian Priority**.
3. **Run Simulation** — Click **Run Simulation** to process the decision and play the animation.
4. **Outcome Dashboard** — View decision, survivors, legal liability, and public reaction index (0–100).

## Tech

- HTML, CSS, JavaScript only.
