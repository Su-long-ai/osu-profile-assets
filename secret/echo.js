(() => {
  'use strict';
  const button=document.querySelector('#echo-play'), glimmer=document.querySelector('#afterglow');
  const status=document.querySelector('#rhythm-status');
  const sequence=[['J',392.00],['K',440.00],['D',293.66],['F',329.63]];
  const pulseMs=360, sustain=.26;
  let context=null,playing=false,serial=0,timers=[],voices=[];
  const found=()=>localStorage.getItem('nb036-misc-v3:keys')==='1';
  const show=()=>{button.hidden=!found()};
  const clearVisual=()=>document.querySelectorAll('.echo-active').forEach(e=>e.classList.remove('echo-active'));
  function light(i){
    clearVisual();
    if(i<0)return;
    const lane=sequence[i][0];
    document.querySelectorAll('[data-hold="'+lane+'"],[data-note-head="'+lane+'"]').forEach(e=>e.classList.add('echo-active'));
    glimmer.querySelectorAll('circle')[i]?.classList.add('echo-active');
  }
  function stop(){
    ++serial;playing=false;
    timers.forEach(clearTimeout);timers=[];
    for(const v of voices){try{v.gain.gain.cancelScheduledValues(context.currentTime);v.gain.gain.setTargetAtTime(0,context.currentTime,.012);v.osc.stop(context.currentTime+.05)}catch{}}
    voices=[];clearVisual();
    button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','播放四音印记');
  }
  function tone(freq,t){
    const osc=context.createOscillator(),gain=context.createGain();
    osc.type='sine';osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,t);
    gain.gain.linearRampToValueAtTime(.075,t+.024);
    gain.gain.exponentialRampToValueAtTime(.006,t+sustain-.035);
    gain.gain.linearRampToValueAtTime(0,t+sustain);
    osc.connect(gain);gain.connect(context.destination);
    osc.start(t);osc.stop(t+sustain+.025);
    osc.onended=()=>{osc.disconnect();gain.disconnect()};
    voices.push({osc,gain});
  }
  async function play(){
    if(!found())return;
    if(playing){stop();return}
    playing=true;const id=++serial;
    button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','停止四音印记');
    status.textContent='播放主页七轨图的四个音符';
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(Audio){try{context ||= new Audio();await context.resume()}catch{}}
    if(serial!==id||!playing)return;
    const start=context?.state==='running'?context.currentTime+.05:null;
    sequence.forEach(([lane,freq],i)=>{
      if(start!==null){try{tone(freq,start+i*pulseMs/1000)}catch{}}
      timers.push(setTimeout(()=>{if(serial===id)light(i)},50+i*pulseMs));
    });
    timers.push(setTimeout(()=>{if(serial===id){stop();status.textContent='四音印记结束'}},50+sequence.length*pulseMs));
  }
  button.addEventListener('click',()=>{void play()});
  button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)button.click()}});
  document.addEventListener('nb:discovered',show);
  addEventListener('pageshow',show);
  addEventListener('pagehide',()=>{stop();context?.close().catch(()=>{});context=null});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
  show();
})();