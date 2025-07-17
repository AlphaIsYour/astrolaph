<script>
  // Import icons dari lucide-svelte
  import { Play, Minus, Plus, SkipBack, Pause, SkipForward } from 'lucide-svelte';
  import { onMount } from 'svelte';
  
  // State untuk mengontrol tampilan dan audio
  let isExpanded = false; // Apakah panel sedang terbuka lebar?
  let isFirstClick = true; // Untuk melacak klik pertama (ikon Play)
  let isPlaying = false; // Status apakah audio sedang dimainkan
  let audio; // Element audio
  let currentTime = 0; // Waktu saat ini
  let duration = 0; // Durasi total lagu
  
  // Placeholder data lagu
  const song = {
    title: "What You Wont Do For Love",
    artist: "Bobby Caldwell",
    src: "/song/what-you-wont-do-for-love.mp3"
  };

  onMount(() => {
    // Inisialisasi audio element
    audio = new Audio(song.src);
    
    // Event listeners untuk audio
    audio.addEventListener('loadedmetadata', () => {
      duration = audio.duration;
    });
    
    audio.addEventListener('timeupdate', () => {
      currentTime = audio.currentTime;
    });
    
    audio.addEventListener('ended', () => {
      isPlaying = false;
    });
    
    // Cleanup saat component di-destroy
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  });

  function handleToggle() {
    // Jika ini klik pertama, tandai bukan lagi pertama kali dan mulai audio
    if (isFirstClick) {
      isFirstClick = false;
      playAudio();
    }
    // Ubah status expand/collapse
    isExpanded = !isExpanded;
  }
  
  function playAudio() {
    if (audio) {
      audio.play();
      isPlaying = true;
    }
  }
  
  function pauseAudio() {
    if (audio) {
      audio.pause();
      isPlaying = false;
    }
  }
  
  function togglePlayPause() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }
  
  function skipForward() {
    if (audio) {
      audio.currentTime = Math.min(audio.currentTime + 10, audio.duration);
    }
  }
  
  function skipBackward() {
    if (audio) {
      audio.currentTime = Math.max(audio.currentTime - 10, 0);
    }
  }
  
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  function handleProgressClick(event) {
    if (audio && duration > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audio.currentTime = newTime;
    }
  }
</script>

<!-- Container utama dengan padding untuk gambar yang overflow -->
<div class="fixed bottom-5 left-5">
  <!-- Wrapper untuk gambar yang bisa keluar -->
  <div class="relative">
    <!-- Gambar Album - Posisi di luar card -->
    <div class="absolute left-0.5 z-10 transition-all duration-300 ease-out" 
         class:-top-2={!isExpanded} 
         class:-top-1.5={isExpanded}>
      <img 
        src="/bs.png" 
        alt="BackSong" 
        class="object-cover rounded-lg transition-all duration-300 ease-out transform"
        class:w-18={!isExpanded}
        class:h-18={!isExpanded}
        class:w-25={isExpanded}
        class:h-25={isExpanded}
        class:scale-100={!isExpanded}
        class:scale-105={isExpanded}
      >
    </div>

    <!-- Card Lagu -->
    <div 
      class="bg-white text-gray-800 rounded-lg shadow-2xl overflow-visible transition-all duration-300 ease-out border border-gray-200 relative"
      class:w-25={!isExpanded}
      class:w-105={isExpanded}
      class:h-16={!isExpanded}
      class:h-24={isExpanded}
    >
      <div class="relative w-full h-full p-3 flex items-center">
        <!-- Spacer untuk gambar yang ada di luar -->
        <div class="w-14 h-14 flex-shrink-0"></div>

        <!-- Konten Player (Hanya tampil saat 'isExpanded') -->
        {#if isExpanded}
          <div class="flex flex-col justify-center flex-1 ml-10 animate-fade-in">
            <!-- Info Lagu dan Kontrol -->
            <div class="flex items-center justify-between mb-2">
              <!-- Info Lagu -->
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate text-gray-800">{song.title}</p>
                <p class="text-xs text-gray-500 truncate">{song.artist}</p>
              </div>

              <!-- Kontrol Audio (Prev, Pause/Play, Next) -->
              <div class="flex items-center space-x-2">
                <!-- Previous Button -->
                <button 
                  class="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Previous track"
                  on:click={skipBackward}
                >
                  <SkipBack size={16} />
                </button>
                
                <!-- Play/Pause Button -->
                <button 
                  class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors border border-gray-300"
                  aria-label={isPlaying ? 'Pause track' : 'Play track'}
                  on:click={togglePlayPause}
                >
                  {#if isPlaying}
                    <Pause size={16} class="text-gray-600" />
                  {:else}
                    <Play size={16} class="text-gray-600 ml-0.5" />
                  {/if}
                </button>
                
                <!-- Next Button -->
                <button 
                  class="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Next track"
                  on:click={skipForward}
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>
            
            <!-- Progress Bar dan Time -->
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span class="w-8 text-right">{formatTime(currentTime)}</span>
              <button 
                class="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                on:click={handleProgressClick}
                on:keydown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleProgressClick(e);
                  }
                }}
                aria-label="Seek audio progress"
                role="slider"
                aria-valuemin="0"
                aria-valuemax={duration}
                aria-valuenow={currentTime}
              >
                <div 
                  class="h-full bg-blue-500 rounded-full transition-all duration-500 pointer-events-none"
                  style="width: {duration > 0 ? (currentTime / duration) * 100 : 0}%"
                ></div>
              </button>
              <span class="w-8">{formatTime(duration)}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Tombol Kontrol (Div terpisah) -->
    <button 
      on:click={handleToggle}
      class="absolute -top-5 -right-5 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black z-20 transition-all duration-300 hover:scale-105 shadow-lg border-2 border-gray-200"
      aria-label="Toggle music player"
    >
      {#if isFirstClick}
        <!-- Play Icon -->
        <Play size={16} class="ml-0.5" />
      {:else if isExpanded}
        <!-- Minus Icon -->
        <Minus size={16} />
      {:else}
        <!-- Plus Icon -->
        <Plus size={16} />
      {/if}
    </button>
  </div>
</div>

<style>
  /* Animasi sederhana untuk fade-in konten */
  @keyframes fade-in {
    from { 
      opacity: 0; 
      transform: translateX(-15px) scale(0.95); 
    }
    to { 
      opacity: 1; 
      transform: translateX(0) scale(1); 
    }
  }
  .animate-fade-in {
    animation: fade-in 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
</style>