# Nim-Game

A web-based implementation of a variant of the classic game of Nim, featuring multiple rule‐sets and AI opponents. Features human vs AI, AI vs AI, and probability‐driven gameplay in your browser. For use as an introduction to ML in high school. Dice are used to simulate transition probabilities, which are adapted during gameplay to gradually approach an optimal strategy. This mimics a learning process similar to machine learning, where outcomes shape the system's behavior over time.

---

## 🧠 Educational Context & Recommendation

This project is designed to complement an **unplugged** version of the Nim game (see the rule images). It's helpful to let students first explore the game with real dice. Playing unplugged can give players a clearer feel for the game and learning mechanics.

The digital versions provided here are useful for:

* Reducing repetition during play
* Exploring outcomes of the learning process
* Observing the learning process in AI vs AI matches
* Discuss optimal gameplay strategies

The simulations are not intended as standalone replacements, but as a way to **support and extend** the unplugged experience.

---

## 📂 Project Structure

```

Nim-Spiel/
├── index.html             # Main menu and rules selector
├── Regeln alt.jpeg        # Classic game rules (old version)
├── Regeln neu.jpeg        # Updated game rules (new version)
├── V0/                     # Prototype: basic UI & gameplay
│   ├── index.html
│   ├── script.js
│   └── style.css
├── V1/                     # Old rules: human vs human
│   ├── index.html
│   ├── script.js
│   └── style.css
├── V2/                     # New rules: human vs AI
│   ├── index.html
│   ├── script.js
│   └── style.css
├── V3/                     # New rules: AI vs AI (dice)
│   ├── index.html
│   ├── script.js
│   └── style.css
└── V4/                     # New rules: AI vs AI (probabilistic)
├── index.html
├── script.js
└── style.css

````

## 🎮 Live Demo

Open `index.html` in your browser to get started:
```bash
git clone https://github.com/MarcFranke/nim-game.git
cd nim-game
open index.html
````

## ⚙️ Features

* **Multiple Rule-Sets**

  * Old rules (AI vs human)
  * New rules with optional second AI opponent
  * AI vs AI with probabilities 


* **Pure Web Technologies**

  * HTML5, CSS3 (Flexbox, responsive design)
  * Vanilla JavaScript (ES6 modules)

* **Visual Rulebook**

  * `Regeln alt.jpeg`: Drawing of the original rules (outdated — too complex for effective use in a classroom setting)

  * `Regeln neu.jpeg`: Updated and simplified rule set (better suited for unplugged use)

  * Created by Daniel Hoherz, Osnabrück. Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/MarcFranke/nim-game.git
   ```

2. **Browse the game**

   * Open the root `index.html`
   * Select your preferred version
   * Enjoy the game!

3. **Customize**

   * Tweak `script.js` in each version to adjust piles, turn logic, or AI strategy
   * Modify `style.css` for your own styling preferences

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add something awesome'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

Please ensure code is well‐documented and follows existing style conventions.

## 📄 License

* **Code**: GNU General Public License v3.0 ([GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html))
* **Rules**: Created by Daniel Hoherz, Osnabrück. CC BY-NC-SA 4.0

