<img width="724" height="100" alt="logo_blackout" src="https://github.com/user-attachments/assets/c5129571-13c1-4c3c-ae92-5cca960b1fc8" />

## 👋 Bienvenue
Nous sommes trois étudiants passionnés qui participons au concours **Games On Web 2026** avec notre jeu **BLACKOUT**.\
L'intégralité du code source est disponible sur ce dépôt GitHub.

## Jouer

Le jeu est hébergé sur **Vercel** et est **accessible en ligne**.

> [!NOTE]
> Testé sur un Mac Mini M4 2025 — Chrome recommandé pour des performances optimales (Moins conseillé d'utilisé Safari !)
> Lien du site de notre jeu : [https://blackout-gow-ai4human.vercel.app](https://blackout-gow-ai4human.vercel.app)

<img width="800" height="415" alt="blackout" src="https://github.com/user-attachments/assets/0b48b7f1-c80d-465e-a64f-682fd0d6920e" />

---

## Lien du site pour Jouer à Blackout

Plongez dans l’univers de Blackout et tentez de survivre dans un monde envahi par des IA hostiles.
[https://blackout-gow-ai4human.vercel.app](https://blackout-gow-ai4human.vercel.app)

## À propos de nous

Nous sommes trois étudiants réunis autour d'un objectif commun : concevoir **notre jeu vidéo** dans le cadre du concours Games On Web 2026.

- [Akira Santhakumaran](https://github.com/Akira98000) : Chef de projet, développement du code principal, architecture du jeu et modélisation 3D, IA.
- [Jeremy Moncada](https://github.com/Ye4hL0w) : Développement des mécaniques de jeu, UI/UX et intégration des assets.
- [Alexander Boretti](https://github.com/X3LAX) : Participation aux tests, développement de quelques manches et apport d’idées

Bien que chacun possède ses propres compétences, nous avons mis nos forces en commun afin de dépasser nos limites et mener à bien ce projet ambitieux 
malgré le temps restreint dont nous disposions — après tout, nous sommes alternants !

## 📹 Ressources & Tutoriels vidéo

Voici l’ensemble de nos vidéos :

- [Introduction](https://youtu.be/4EoNDClSL2o)
- [Level 1 - Faux laissez-passer](https://youtu.be/Eqwl_U9HI7c)
- [Level 2 - Combat du compagnon infecté](https://youtu.be/qN44rlkKwMw)
- [Level 3 - Réparation du compagnon](https://youtu.be/otSS0kGdaAc)
- [Level 4 - Infiltration IA](https://youtu.be/nvgABgGhr8E)
- [Level 5 - Destruction des caméras](https://youtu.be/LxaS-PA4w_Q)
- [Level 6 - Attaque des robots policiers IA](https://youtu.be/dq0PfffLbvg)
- [Level 7 - Découverte de Jacob](https://youtu.be/PlpQH9v7Z_E)
- [Level 8 - Connexion IA](https://youtu.be/Pf-UrF0eR_E)
- [Level 9 - Entrée de la centrale de données](https://youtu.be/7uYBQiFguak)
- [Épilogue de fin](https://youtu.be/M3UJqIa7CRo)

> [!NOTE]
> Tous les niveaux sont enregistrés et publiés sur YouTube.

---

## ⚙️ Fonctionnalités

- **Monde 3D immersif** : Explorez des environnements cyberpunk avec une ville ouverte et des intérieurs détaillés
- **Système de combat** : Tir de projectiles avec effets visuels (muzzle flash, impacts) et IA ennemie réactive
- **Machine à états IA** : Ennemis avec comportements *Wander → Pursuit → Shoot → Retreat → Dead*
- **Système de hacking** : Mini-jeux d'intrusion informatique, overlays de fréquence et puzzles ML
- **Scan IA** : Protocole de reconnaissance pour identifier et synchroniser des agents robots
- **Progression narrative** : 9 manches enchaînées avec cinématiques d'introduction et objectifs clairs
- **Personnages jouables** : Choisissez entre George (agilité) et Stephane (robustesse)
- **Carte d'identité animée** : Animation 3D coin-flip lors de la collecte de documents
- **Environnement vivant** : Circulation de véhicules, PNJ dynamiques, boussole et minimap

---

## 🗺️ Manches du jeu

| # | Titre | Objectif |
|---|-------|----------|
| 1 | **Identification** | Collectez les cartes et tampons pour constituer votre identité |
| 2 | **Infiltration** | Neutralisez le robot et hackez le terminal de données |
| 3 | **Récupération** | Trouvez la carte mère et le disque dur dans le secteur |
| 4 | **Piratage** | Accédez à l'ordinateur central et obtenez le code GOW2026 |
| 5 | **Élimination** | Détruisez toutes les unités IA ennemies de la zone |
| 6 | **Libération** | Nettoyez les zones tenues par les IA et récupérez les clés |
| 7 | **Contact** | Localisez Jacob Martin et résolvez le puzzle d'accréditation ML |
| 8 | **Espionnage** | Scannez et synchronisez les agents robots pour décrypter les coordonnées |
| 9 | **Accès Usine** | Atteignez l'usine centrale IA et entrez la combinaison de sécurité |

---

## 🎮 Contrôles

| Action | Touche |
|--------|--------|
| Mouvement | `Z Q S D` |
| Viser / Regarder | Souris |
| Tirer | Clic gauche |
| Mode combat (fight idle) | Maintenir `F` |
| Interagir | `E` |
| Scanner (protocole IA) | `K` |
| Pause | `Échap` |
| Minimap | `M` |
| Skip manche (cheat) | `Tab` × 3 |

---

## 🛠️ Stack Technique

| Catégorie | Technologie |
|-----------|-------------|
| Moteur 3D | BabylonJS 9.x |
| Build | Vite 8.x |
| Icônes | Font Awesome 7 |
| Physique | Moteur de collision intégré BabylonJS |
| UI | HTML/CSS natif + BabylonJS GUI |
| Audio | Web Audio API |
| Animations | AnimationGroup BabylonJS + Mixamo |

---

## 🧠 Architecture Technique

### 🧩 Systèmes principaux

- **Gestion des niveaux** : Chargement modulaire et asynchrone — chaque manche est un module ES indépendant (`loadLevelN`)
- **Système de tir** : Projectiles 3D avec détection de collision distance-based, effets de flash et d'impact
- **Machine à états IA** : `WANDER → PURSUIT → SHOOT → RETREAT → DEAD` avec stats différenciées par type d'ennemi
- **Caméra ArcRotate** : Contrôle full 360° avec limites configurables (`gameConfig.js`)
- **Billboard 3D** : Textes et barres de vie flottants via `DynamicTexture` + `BILLBOARDMODE_ALL`
- **Gestionnaire de PNJ** : Flotte de véhicules avec trajectoires A↔B et ratios de départ
- **Registre d'ennemis** : `scene.metadata.ennemiHandles[]` centralisé pour la détection multi-cible
- **Système de collectibles** : Spawn, animation de flottement et ramassage avec rayon configurable

### 🚀 Optimisations des performances

- **Chargement asynchrone** : Assets chargés à la demande avec `SceneLoader.ImportMeshAsync`, pas de blocage
- **Spawn validé** : Vérification rayon (ray cast) avant spawn ennemi — évite les unités bloquées dans les murs
- **Téléportation de secours** : Le joueur ne peut pas rester coincé sur un élément 3D — respawn disponible
- **Distance caméra réduite** : Clipping à 300 unités pour limiter le nombre de draw calls
- **Libération mémoire** : `dispose()` systématique sur chaque handle de niveau à la transition
- **Textures optimisées** : Reduction de la résolution des GLB sous Blender avant export
- **Indices de navigation** : Refactor complet des hints visuels — gain de ~80fps sur Mac M4 (40fps → 120fps)

---

## 🐛 Galères & Solutions

### IA bloquée dans les bâtiments
Les ennemis pouvaient spawn derrière des murs, rendant la manche impossible à terminer. **Solution** : validation par ray cast avant chaque spawn — si le rayon est bloqué, la position est rejetée et recalculée.

### Joueur coincé sur des éléments 3D
Un joueur bloqué obligeait à recommencer de zéro. **Solution** : système de téléportation d'urgence accessible à tout moment pour replacer le joueur sans perdre sa progression.

### Textes 3D inversés sur les billboards
Les `DynamicTexture` avec `BILLBOARDMODE_ALL` produisaient du texte en miroir. **Solution** : utilisation de `tex.drawText()` natif Babylon + `material.backFaceCulling = false`, sans `sideOrientation` ni `scaling.x = -1`.

### Performance : 40fps → 120fps
Les overlays de navigation (hints 3D, indices visuels) généraient des milliers de polygones. **Solution** : refactor complet en UI CSS/DOM + suppression des meshes de particules superflus.

---

## 💾 Installation

```bash
# Cloner le dépôt
git clone https://github.com/Akira98000/akiirran_babylon.js.git
```

```bash
# Se rendre dans le dossier
cd akiirran_babylon.js
```

```bash
# Installer les dépendances
npm install
```

```bash
# Lancer le jeu en développement
npm run dev
```

```bash
# Build de production
npm run build
```

---

## 📋 Prérequis

- Navigateur moderne avec support **WebGL 2** — **Chrome recommandé**
- Clavier AZERTY/QWERTY + souris
- Machine récente conseillée (le jeu est gourmand en ressources 3D) -> Ne tester pas avec un PC de 2016 :) !

---

## 🧩 Assets utilisés

### Personnages & Ennemis
- **George** (personnages jouables) : [George.glb](https://sketchfab.com/3d-models/bearded-man-low-poly-animated-5718a53d18a142f686b1d9f02a637773)
- **Ennemi IA 1** : [poly.pizza/m/EMoKrFEBkc](https://poly.pizza/m/EMoKrFEBkc)
- **Jacob** : [Jacob.glb](https://sketchfab.com/3d-models/low-poly-ordinary-man-in-shirt-and-pants-f658b9e1bb324f2ab1e9f00d7d6b4065)
- **Robot Agent** : [poly.pizza](https://poly.pizza/m/QCm7qe9uNJ)

### Objets & Collectibles
- **Carte mère** : [poly.pizza](https://poly.pizza/m/qaVbbKkil7)
- **Disque dur** : [poly.pizza](https://poly.pizza/m/8nMC2GZProF)
- **Ordinateur** : [poly.pizza](https://poly.pizza/m/emxvTSMKnt)
- **Clé** : [poly.pizza](https://poly.pizza/m/bg6e1lfNsO)

### Environnement
- **Feux de signalisation** : [poly.pizza/m/aYC3t5ymln](https://poly.pizza/m/aYC3t5ymln)
- **Clôtures** : [poly.pizza/m/aE3GIx8jIH](https://poly.pizza/m/aE3GIx8jIH)
- **Routes** : [poly.pizza/m/5BPCPOycxC](https://poly.pizza/m/5BPCPOycxC)

### Véhicules
- **Voiture PNJ** : [poly.pizza](https://poly.pizza/m/WRd1piJOfh) — modifié sous Blender
- **Vespa PNJ** : [poly.pizza](https://poly.pizza/m/blGLclvvdEM)
- **Robot sur la Vespa**: [poly.pizza](https://poly.pizza/m/9A6cuitiB_4)
- **Voiture 2** : [poly.pizza](https://poly.pizza/m/tzOLXetacM)

### Camps :
- **tente** : [poly.pizza](https://poly.pizza/m/5Q7qIrfDxA)
- **gun** :[poly.pizza](https://poly.pizza/m/3To2e7sKmO)
- **Tente Militaire** : [poly.pizza](https://poly.pizza/m/vQANVbSE0v)
- **Soldier** : [poly.pizza](https://poly.pizza/m/dwSTUGtcaN)
- **Barriere** : [poly.pizza](https://poly.pizza/m/ZSQMyIqPTz)

### Buildings 
- **Pack Building4 -> MainPart** : [PackBuilding4](https://www.cgtrader.com/items/6462436/)
- **Pack Building3** : [PackBuilding-3](https://sketchfab.com/3d-models/city-town-pack-0f7f7df37e234fff8b0cf4671ff3bdaa)
- **Pack Buidling2** : [PackBuilding-2](https://sketchfab.com/3d-models/low-poly-public-buildings-pack-b51a75af7f4e41579ec16e28ee96b676)
- **Pack Building1** : [PackBuilding-1](https://sketchfab.com/3d-models/low-poly-business-buildings-pack-2838e30360ce4b0cb2cc416dca213111)

### Map 
> [!NOTE]
> Environ 75 % des modèles GLB proviennent de Poly Pizza￼ et 25 % de Sketchfab￼. L’ensemble des modèles a ensuite été retravaillé et adapté via **Blender**￼.
> Les animations sont issues de **Mixamo** et retargetées sous Blender.
---

*BLACKOUT — GameOnWeb 2026 · Université Côte d'Azur*
