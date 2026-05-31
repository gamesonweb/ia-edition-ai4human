// ─── MOTO-AI — Panneau cyberpunk terminal ─────────────────────────────────────
import './aiAssistant.css'
import { t } from '../minigame/tron/i18n.js'

const RESPONSES = [
  {
    keys: ['contrôle', 'controls', 'bouton', 'touche', 'conduire', 'piloter', 'comment', 'jouer', 'commande'],
    reply: `**Contrôles :**\n\n• **Z / ↑** Accélérer\n• **S / ↓** Freiner\n• **Q / ←** Gauche\n• **D / →** Droite\n• **K** Fermer l'assistant`,
  },
  {
    keys: ['vitesse', 'speed', 'rapide', 'vite', 'accélér', 'km/h', 'kmh'],
    reply: `**Vitesse max : 110 km/h**\n\nMaintenez **Z** pour accélérer progressivement. La friction naturelle (×0.985) ralentit la moto quand vous relâchez.`,
  },
  {
    keys: ['ville', 'city', 'map', 'carte', 'neo', 'cyberpunk', 'neon', 'néon', 'akiirran', 'sigma'],
    reply: `**Neo Akiirran — Sigma-7**\n\nMétropole cyberpunk divisée en 6 secteurs. Les wireframes *cyan* et *magenta* sont des résiduels numériques du Réseau.`,
  },
  {
    keys: ['phare', 'lumière', 'light', 'feu', 'spot', 'éclairage'],
    reply: `**Phare 700W** dynamique avec ombres temps réel. Le Bloom post-processing génère les halos lumineux.`,
  },
  {
    keys: ['quitter', 'exit', 'sortir', 'retour', 'fermer'],
    reply: `Bouton **← QUITTER** en bas à gauche pour quitter la moto. Touche **K** ou **Échap** pour fermer cet assistant.`,
  },
  {
    keys: ['bonjour', 'salut', 'hello', 'hi', 'hey', 'allo', 'bonsoir'],
    reply: `**Bonjour, pilote !** 👋\n\nJe suis MOTO-AI, votre copilote pour Neo Akiirran.\n\nDemandez-moi les contrôles, la vitesse, la carte…`,
  },
  {
    keys: ['secret', 'easter', 'caché', 'hidden', 'truc', 'astuce', 'glitch'],
    reply: `**[CLASSIFIÉ — NIV.3]**\n\n> *"Les confins de Sigma-7 cachent des glitchs où le Réseau se superpose au monde physique…"*`,
  },
  {
    keys: ['moto', 'motorbike', 'bike', 'véhicule', 'modèle'],
    reply: `**Cyberpunk Scrambler MK-VII**\n\n• Vitesse max : 160 km/h (Tron)\n• Échelle : ×2.0\n• Phare SpotLight dynamique\n• Roues animées indépendamment`,
  },
  {
    keys: ['tour', 'lap', 'checkpoint', 'circuit', 'course', 'race', 'finish'],
    reply: `**Système de course :**\n\n• Passez tous les **checkpoints** dans l'ordre\n• Complétez les tours pour gagner\n• Le temps est affiché en haut à gauche\n• Les IAs adverses suivent un tracé enregistré`,
  },
  {
    keys: ['enregistr', 'record', 'tracé', 'trace', 'touche r', 'ia', 'adversaire'],
    reply: `**Tracé IA :**\n\n• Appuyez sur **R** pour enregistrer votre tracé\n• Roulez le circuit complet\n• Appuyez à nouveau sur **R** pour sauvegarder\n• Les IAs reproduiront votre chemin`,
  },
  {
    keys: ['position', 'coordonnée', 'coord', 'touche p', 'spawn', 'localisation'],
    reply: `**Coordonnées :**\n\nAppuyez sur **P** pour afficher votre position actuelle dans la console.\n\nSpawn de départ : X=-29.53, Z=115.73`,
  },
  {
    keys: ['tron', 'grille', 'néon', 'neon', 'cyber', 'grid'],
    reply: `**Mode TRON — Grille Cyber**\n\nVous êtes dans la simulation Grille de Neo Akiirran.\n\n• Wireframes néon sur toute la carte\n• Trail lumineux derrière votre moto\n• Feux de frein dynamiques\n• Adversaires IA sur tracé enregistré`,
  },
]

const FALLBACKS = [
  `Le Réseau traite votre requête… Je n'ai pas de données précises sur ce sujet. Essayez : *contrôles*, *vitesse*, *carte*…`,
  `**[Signal partiel]** — Reformulez votre question sur la conduite ou la ville de Neo Akiirran.`,
  `Capteurs actifs. Posez-moi une question sur les *contrôles* ou *Neo Akiirran*.`,
]

// ─── Cheats disponibles ───────────────────────────────────────────────────────
export const CHEATS = {
  '1': { label: '⚡ Immobiliser adversaires',  desc: 'Freeze les IA pendant 5 secondes',        duration: '5s'  },
  '2': { label: '🚀 Turbo 200 km/h',           desc: 'Vitesse max débloquée à 200 km/h',        duration: '10s' },
  '3': { label: '💨 Nitro instantanée',         desc: 'Vitesse maximale immédiate',              duration: '—'   },
  '4': { label: '🐌 Slow Motion',               desc: 'Temps ralenti à 40% pendant 6 secondes', duration: '6s'  },
  '5': { label: '⏱️ Reset chrono',              desc: 'Remet le timer de course à zéro',         duration: '—'   },
  '6': { label: '🏁 Tour bonus',                desc: 'Passe directement au tour suivant',       duration: '—'   },
}

function getResponse(msg) {
  const lower = msg.toLowerCase()
  for (const { keys, reply } of RESPONSES) {
    if (keys.some(k => lower.includes(k))) return reply
  }
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]
}

function md(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function createAIAssistant({ onClose, onCheat }) {
  let isTyping = false

  // Créer le panneau
  const panel = document.createElement('div')
  panel.id = 'moto-ai-panel'
  panel.innerHTML = `
    <div class="mai-corner-br"></div>
    <div class="mai-header">
      <div class="mai-header-left">
        <div class="mai-avatar"><i class="fa-solid fa-microchip"></i></div>
        <div>
          <div class="mai-name">MOTO-AI</div>
          <div class="mai-status"><span class="mai-dot"></span>${t('ai.status')}</div>
        </div>
      </div>
      <button class="mai-close" id="mai-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="mai-sysbar">${t('ai.sysbar')}</div>
    <div class="mai-messages" id="mai-messages">
      <div class="mai-msg mai-msg-ai">
        <div class="mai-prefix"><i class="fa-solid fa-bolt"></i> MOTO-AI</div>
        <div class="mai-bubble">
          <strong>${t('ai.cheats_title')}</strong><br><br>
          ${Object.keys(CHEATS).map(k =>
            `<li><strong>/${k}</strong> &nbsp;—&nbsp; ${t('cheat.' + k + '.label')}</li>`
          ).join('\n')}
          <br><em style="color:rgba(255,255,255,0.25);font-size:10px;letter-spacing:1px">${t('ai.or_ask')}</em>
        </div>
        <div class="mai-time">${now()}</div>
      </div>
    </div>
    <div class="mai-input-area">
      <span class="mai-prompt-label">&gt;</span>
      <input class="mai-input" id="mai-input" type="text" placeholder="${t('ai.placeholder')}" autocomplete="off" spellcheck="false" />
      <button class="mai-send" id="mai-send"><i class="fa-solid fa-paper-plane"></i></button>
    </div>
  `
  document.body.appendChild(panel)

  // Force le navigateur à peindre le panneau AVANT d'ajouter la classe d'animation
  setTimeout(() => panel.classList.add('mai-open'), 20)

  const messagesEl = panel.querySelector('#mai-messages')
  const inputEl    = panel.querySelector('#mai-input')
  const sendBtn    = panel.querySelector('#mai-send')
  const closeBtn   = panel.querySelector('#mai-close')

  closeBtn.addEventListener('click', closePanel)
  sendBtn.addEventListener('click', send)
  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); send() }
    // Empêche K de fermer le panel quand on tape
    e.stopPropagation()
  })

  setTimeout(() => inputEl.focus(), 400)

  function send() {
    const text = inputEl.value.trim()
    if (!text || isTyping) return
    inputEl.value = ''

    // ── Commandes cheat (/1 … /8, /help) ──────────────────────────────────────
    if (text.startsWith('/')) {
      const code = text.slice(1).trim()
      addMsg('user', text)

      const cheat = CHEATS[code]
      if (cheat) {
        addMsgSystem(
          t(`cheat.${code}.label`),
          `${t(`cheat.${code}.desc`)}${cheat.duration !== '—' ? ` · <em>${cheat.duration}</em>` : ''}`,
        )
        onCheat?.(code)
        // Fermer le panel après un court délai pour voir le message de confirmation
        setTimeout(() => closePanel(), 900)
      } else {
        addMsgRaw('ai', t('ai.unknown_cmd', { code }))
      }
      return
    }

    // ── Message IA normal ──────────────────────────────────────────────────────
    addMsg('user', text)
    isTyping = true
    sendBtn.disabled = true

    const typingDiv = addTyping()
    setTimeout(() => {
      typingDiv.remove()
      addMsg('ai', getResponse(text))
      isTyping = false
      sendBtn.disabled = false
      inputEl.focus()
    }, 700 + Math.random() * 700)
  }

  function addMsg(role, text) {
    const div = document.createElement('div')
    div.className = `mai-msg mai-msg-${role}`
    const icon   = role === 'ai' ? '<i class="fa-solid fa-bolt"></i> MOTO-AI' : `<i class="fa-solid fa-user"></i> ${t('ai.pilot')}`
    div.innerHTML = `
      <div class="mai-prefix">${icon}</div>
      <div class="mai-bubble">${role === 'ai' ? md(text) : esc(text)}</div>
      <div class="mai-time">${now()}</div>
    `
    messagesEl.appendChild(div)
    scrollBot()
    return div
  }

  function addMsgRaw(role, html) {
    const div = document.createElement('div')
    div.className = `mai-msg mai-msg-${role}`
    const icon = role === 'ai' ? '<i class="fa-solid fa-bolt"></i> MOTO-AI' : `<i class="fa-solid fa-user"></i> ${t('ai.pilot')}`
    div.innerHTML = `
      <div class="mai-prefix">${icon}</div>
      <div class="mai-bubble">${html}</div>
      <div class="mai-time">${now()}</div>
    `
    messagesEl.appendChild(div)
    scrollBot()
    return div
  }

  function addMsgSystem(title, desc) {
    const div = document.createElement('div')
    div.className = 'mai-msg mai-msg-system'
    div.innerHTML = `
      <div class="mai-prefix"><i class="fa-solid fa-bolt"></i> ${t('ai.system')}</div>
      <div class="mai-bubble mai-bubble-system">
        <span class="mai-system-icon"><i class="fa-solid fa-check-circle"></i></span>
        <div>
          <div class="mai-system-title">${title}</div>
          <div class="mai-system-desc">${desc}</div>
        </div>
      </div>
      <div class="mai-time">${now()}</div>
    `
    messagesEl.appendChild(div)
    scrollBot()
    return div
  }

  function addTyping() {
    const div = document.createElement('div')
    div.className = 'mai-msg mai-msg-ai'
    div.innerHTML = `
      <div class="mai-prefix"><i class="fa-solid fa-bolt"></i> MOTO-AI</div>
      <div class="mai-bubble">
        <div class="mai-typing-bubble">
          <span class="mai-dot-anim"></span>
          <span class="mai-dot-anim"></span>
          <span class="mai-dot-anim"></span>
        </div>
      </div>
    `
    messagesEl.appendChild(div)
    scrollBot()
    return div
  }

  function scrollBot() {
    requestAnimationFrame(() => { messagesEl.scrollTop = messagesEl.scrollHeight })
  }

  function closePanel() {
    panel.classList.remove('mai-open')
    setTimeout(() => panel.remove(), 320)
    onClose?.()
  }

  function now() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function esc(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }

  return { close: closePanel, remove: closePanel }
}
