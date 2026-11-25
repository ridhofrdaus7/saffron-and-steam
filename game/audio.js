let context,muted=false;
export function unlockAudio(){if(!context)context=new (window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume();}
export function setMuted(value){muted=value;}
export function isMuted(){return muted;}
function tone(freq,start,length,type='sine',gain=.035){const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(gain,context.currentTime+start);g.gain.exponentialRampToValueAtTime(.001,context.currentTime+start+length);o.connect(g);g.connect(context.destination);o.start(context.currentTime+start);o.stop(context.currentTime+start+length);}
export function playSound(name){if(!context||muted)return;if(name==='serve'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.07,.2));}else if(name==='chop'){tone(130,0,.07,'triangle',.12);tone(75,.015,.06,'square',.02);}else if(name==='ready'){tone(659,0,.15);tone(880,.09,.22);}else if(name==='bad'){tone(220,0,.18,'triangle');tone(165,.1,.25,'triangle');}else if(name==='sizzle'){for(let i=0;i<8;i++)tone(1100+Math.random()*600,i*.03,.04,'sawtooth',.009);}else tone(440,0,.055,'triangle',.025);}

