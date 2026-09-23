const SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let chordLibrary = {};
        let songsList = [];
        let currentSong = null;
        let transposeSteps = 0;
        let isScrolling = false;
        let scrollTimer = null;

        async function initChordStudio() {
          try {
            const res = await fetch('/api/chords/library');
            const data = await res.json();
            if (!data.success) throw new Error('Akor kütüphanesi yüklenemedi');

            chordLibrary = data.diagrams || {};
            songsList = data.songs || [];

            // Şarkı Seçiciyi Doldur
            const sel = document.getElementById('select-song');
            sel.innerHTML = songsList.map(s => `<option value="${s.id}">${s.title} - ${s.artist}</option>`).join('');

            // Akor haplarını oluştur
            renderChordPills();

            // İlk şarkıyı yükle
            if (songsList.length > 0) {
              loadSong(songsList[0]);
            }
          } catch(err) {
            alert('Akor verileri alınamadı: ' + err.message);
          }
        }

        function renderChordPills() {
          const container = document.getElementById('chord-pills');
          container.innerHTML = Object.keys(chordLibrary).map(c => `
            <button onclick="displayChordDiagram('${c}')" class="px-2 py-0.5 rounded-md text-mistral-ink font-boldbg-mistral-cream hover:bg-mistral-cream-deeper text-mistral-ink border border-mistral-beige-deep font-mono font-bold text-xs transition">
              ${c}
            </button>
          `).join('');
        }

        function displayChordDiagram(chord) {
          const info = chordLibrary[chord] || { fingers: ['x', 'x', 'x', 'x', 'x', 'x'], title: chord };
          document.getElementById('active-chord-name').innerText = info.title || chord;

          const box = document.getElementById('fretboard-display');
          const strings = ['e (1. tel)', 'B (2. tel)', 'G (3. tel)', 'D (4. tel)', 'A (5. tel)', 'E (6. tel)'];
          
          let html = '<div class="space-y-1 font-mono text-[11px]">';
          info.fingers.forEach((f, idx) => {
            const stringName = strings[idx];
            html += `
              <div class="flex items-center justify-between gap-4 py-0.5 border-b border-mistral-hairline/60">
                <span class="text-mistral-stone">${stringName}:</span>
                <strong class="px-2 py-0.5 rounded bg-white border border-mistral-hairline text-mistral-orange font-bold">${f}</strong>
              </div>
            `;
          });
          html += '</div>';
          box.innerHTML = html;
        }

        function loadSong(song) {
          currentSong = song;
          transposeSteps = 0;
          document.getElementById('lbl-transpose-val').innerText = 'Orijinal (0)';
          document.getElementById('song-title').innerText = song.title;
          document.getElementById('song-artist').innerText = song.artist;
          document.getElementById('song-key').innerText = 'Ton: ' + song.key;
          
          renderSongLyrics(song.lyrics);

          // İlk akoru diyagramda göster
          if (song.chords && song.chords.length > 0) {
            displayChordDiagram(song.chords[0]);
          }
        }

        function onSongSelect() {
          const id = document.getElementById('select-song').value;
          const s = songsList.find(x => x.id === id);
          if (s) loadSong(s);
        }

        function transposeChord(chord, steps) {
          const isMinor = chord.endsWith('m') && !chord.endsWith('dim');
          const is7 = chord.endsWith('7');
          let base = chord.replace('m', '').replace('7', '');

          let idx = SCALE.indexOf(base);
          if (idx === -1) return chord;

          let newIdx = (idx + steps) % 12;
          if (newIdx < 0) newIdx += 12;

          return SCALE[newIdx] + (isMinor ? 'm' : '') + (is7 ? '7' : '');
        }

        function transpose(step) {
          if (!currentSong) return;
          transposeSteps += step;

          const sign = transposeSteps > 0 ? '+' : '';
          document.getElementById('lbl-transpose-val').innerText = transposeSteps === 0 ? 'Orijinal (0)' : `${sign}${transposeSteps} Perde`;

          renderSongLyrics(currentSong.lyrics);
        }

        function renderSongLyrics(rawLyrics) {
          const sheet = document.getElementById('song-sheet');
          
          // [Am] kalıplarını bul ve transpoze et
          const parsed = rawLyrics.replace(/\[([A-G][b#]?[m7]?)\]/g, (match, chord) => {
            const transposed = transposeChord(chord, transposeSteps);
            return `<span onclick="displayChordDiagram('${transposed}')" class="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer hover:bg-mistral-orange hover:text-white transition shadow-2xs">${transposed}</span>`;
          });

          sheet.innerHTML = parsed;
        }

        function toggleAutoScroll() {
          isScrolling = !isScrolling;
          const icon = document.getElementById('scroll-icon');
          const text = document.getElementById('scroll-text');
          const btn = document.getElementById('btn-autoscroll');

          if (isScrolling) {
            icon.innerText = '⏸';
            text.innerText = 'Kaydırmayı Durdur';
            btn.className = 'w-full py-2.5 px-3 rounded-lg bg-mistral-orange text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs';
            scrollTimer = setInterval(() => {
              window.scrollBy({ top: 1, behavior: 'auto' });
            }, 45);
          } else {
            icon.innerText = '📜';
            text.innerText = 'Kaydırmayı Başlat';
            btn.className = 'w-full py-2.5 px-3 rounded-lg text-mistral-ink font-boldbg-mistral-cream hover:bg-mistral-cream-deeper text-mistral-ink border border-mistral-beige-deep text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs';
            if (scrollTimer) clearInterval(scrollTimer);
          }
        }

        document.addEventListener('DOMContentLoaded', initChordStudio);
