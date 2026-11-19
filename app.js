const $ = (id) => document.getElementById(id);
const video = $("video"), music = $("music"), stage = $("previewStage");
let videoURL = null, musicURL = null, audioContext = null, musicSource = null, musicGain = null;
let videoAudioSource = null, videoGain = null, exportUrl = null, exporting = false;

const fmt = (n) => { if (!Number.isFinite(n)) return "00:00"; const m=Math.floor(n/60),s=Math.floor(n%60); return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; };
const start = () => Number($("startRange").value);
const end = () => Number($("endRange").value);
const setStatus = (s) => $("status").textContent = s;

function updateCaption(){
  const el=$("overlayPreview"); el.textContent=$("caption").value;
  el.className="overlay-text "+$("textPosition").value;
  el.style.fontSize=$("textSize").value+"px";
}
function updateFormat(){
  const val=$("ratio").value;
  if(val==="9:16") stage.style.aspectRatio="9 / 16";
  else if(val==="1:1") stage.style.aspectRatio="1 / 1";
  else if(val==="16:9") stage.style.aspectRatio="16 / 9";
  else if(video.videoWidth && video.videoHeight) stage.style.aspectRatio=video.videoWidth+" / "+video.videoHeight;
}
function updateTrim(){
  const d=video.duration||0;
  $("startRange").max=d; $("endRange").max=d;
  if(Number($("endRange").value)>d || Number($("endRange").value)===100) $("endRange").value=d;
  $("startOut").textContent=start().toFixed(1)+"s";
  $("endOut").textContent=end().toFixed(1)+"s";
  if(video.currentTime<start() || video.currentTime>end()) video.currentTime=start();
}
function syncUI(){
  const d=video.duration||0;
  $("timeLabel").textContent=fmt(video.currentTime)+" / "+fmt(d);
  $("durationLabel").textContent=fmt(d);
  $("seek").value=d?video.currentTime/d*100:0;
}
async function ensureAudio(){
  if(!audioContext){
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) throw new Error("Audio mixing is not supported by this browser.");
    audioContext=new AC();
    musicSource=audioContext.createMediaElementSource(music);
    musicGain=audioContext.createGain(); musicSource.connect(musicGain); musicGain.connect(audioContext.destination);
    videoAudioSource=audioContext.createMediaElementSource(video);
    videoGain=audioContext.createGain(); videoAudioSource.connect(videoGain); videoGain.connect(audioContext.destination);
  }
  if(audioContext.state==="suspended") await audioContext.resume();
  musicGain.gain.value=Number($("musicVolume").value)/100;
  videoGain.gain.value=0.85;
}
$("videoFile").addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f)return;
  if(videoURL)URL.revokeObjectURL(videoURL);
  videoURL=URL.createObjectURL(f); video.src=videoURL; video.load();
  $("fileInfo").textContent="Video: "+f.name+" · "+(f.size/1024/1024).toFixed(1)+" MB";
  $("emptyState").hidden=true; stage.classList.add("has-video");
  $("downloadLink").hidden=true;
});
video.addEventListener("loadedmetadata",()=>{
  $("startRange").value=0; $("endRange").value=video.duration||0;
  updateTrim(); updateFormat(); syncUI();
  $("seek").value=0;
});
$("musicFile").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  if(musicURL)URL.revokeObjectURL(musicURL);
  musicURL=URL.createObjectURL(f);music.src=musicURL;music.load();
  $("fileInfo").textContent=($("fileInfo").textContent==="No media selected yet."?"":$("fileInfo").textContent+" · ")+"Music: "+f.name;
  $("downloadLink").hidden=true;
});
$("playBtn").addEventListener("click",async()=>{
  if(!video.src){setStatus("Import a video first.");return;}
  try{
    await ensureAudio();
    if(video.paused){if(video.currentTime<start()||video.currentTime>=end())video.currentTime=start();video.playbackRate=Number($("speed").value);await video.play();if(music.src){music.currentTime=0;await music.play();}$("playBtn").textContent="Ⅱ";}
    else{video.pause();music.pause();$("playBtn").textContent="▶";}
  }catch(err){setStatus(err.message||"Could not start playback.");}
});
$("stopBtn").addEventListener("click",()=>{video.pause();music.pause();video.currentTime=start();$("playBtn").textContent="▶";syncUI();});
video.addEventListener("timeupdate",()=>{
  syncUI();
  if(!exporting && video.currentTime>=end()){video.pause();music.pause();$("playBtn").textContent="▶";}
});
$("seek").addEventListener("input",()=>{if(video.duration)video.currentTime=video.duration*Number($("seek").value)/100;});
["startRange","endRange"].forEach(id=>$(id).addEventListener("input",()=>{
  if(id==="startRange" && start()>end()-0.1)$("startRange").value=Math.max(0,end()-0.1);
  if(id==="endRange" && end()<start()+0.1)$("endRange").value=Math.min(video.duration,start()+0.1);
  updateTrim();
}));
$("speed").addEventListener("change",()=>{video.playbackRate=Number($("speed").value);});
$("ratio").addEventListener("change",updateFormat);
["caption","textSize","textPosition"].forEach(id=>$(id).addEventListener("input",updateCaption));
$("musicVolume").addEventListener("input",()=>{$("volumeOut").textContent=$("musicVolume").value+"%";if(musicGain)musicGain.gain.value=Number($("musicVolume").value)/100;});

function canvasDimensions(){
  const vw=video.videoWidth||720,vh=video.videoHeight||1280,ratio=$("ratio").value;
  let w,h;
  if(ratio==="9:16"){w=720;h=1280;}else if(ratio==="1:1"){w=900;h=900;}else if(ratio==="16:9"){w=1280;h=720;}else{const scale=Math.min(1280/vw,1280/vh);w=Math.round(vw*scale);h=Math.round(vh*scale);}
  return [w,h];
}
function drawFrame(ctx,canvas){
  const [w,h]=[canvas.width,canvas.height],vw=video.videoWidth,vh=video.videoHeight;
  ctx.fillStyle="#080a10";ctx.fillRect(0,0,w,h);
  if(vw&&vh){
    const scale=Math.max(w/vw,h/vh),dw=vw*scale,dh=vh*scale;
    ctx.drawImage(video,(w-dw)/2,(h-dh)/2,dw,dh);
  }
  const text=$("caption").value.trim();
  if(text){
    const size=Number($("textSize").value)*(w/360);
    ctx.font=`800 ${size}px Arial, sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    const lines=wrapText(ctx,text,w*.84),lineH=size*1.2;
    let y=$("textPosition").value==="top"?h*.14:$("textPosition").value==="bottom"?h*.86:h/2;
    if(lines.length>1)y-=((lines.length-1)*lineH)/2;
    lines.forEach((line,i)=>{ctx.lineWidth=Math.max(3,size*.12);ctx.strokeStyle="#000";ctx.strokeText(line,w/2,y+i*lineH,w*.88);ctx.fillStyle="#fff";ctx.fillText(line,w/2,y+i*lineH,w*.88);});
  }
}
function wrapText(ctx,text,maxWidth){
  const words=text.split(/\s+/),lines=[];let line="";
  for(const word of words){const test=line?line+" "+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}
  if(line)lines.push(line);return lines;
}
$("exportBtn").addEventListener("click",async()=>{
  if(exporting)return;
  if(!video.src||!video.duration){setStatus("Import a video before exporting.");return;}
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){setStatus("This browser does not support in-browser video export. Try the latest Safari and test with a short clip.");return;}
  if(end()-start()<0.2){setStatus("Choose a longer trim range.");return;}
  exporting=true;$("exportBtn").disabled=true;$("progressWrap").hidden=false;$("downloadLink").hidden=true;
  let stream=null,recorder=null,raf=0;
  try{
    await ensureAudio();
    const canvas=document.createElement("canvas");[canvas.width,canvas.height]=canvasDimensions();
    const ctx=canvas.getContext("2d");
    stream=canvas.captureStream(30);
    // Mix the original video audio and selected music into the recording.
    const mix=audioContext.createMediaStreamDestination();
    videoGain.disconnect();musicGain.disconnect();
    videoGain.connect(mix);musicGain.connect(mix);
    mix.stream.getAudioTracks().forEach(t=>stream.addTrack(t));
    let mime="";for(const candidate of ["video/mp4;codecs=avc1.42E01E,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm"]){if(MediaRecorder.isTypeSupported(candidate)){mime=candidate;break;}}
    if(!mime)throw new Error("No supported recording format was found in this browser.");
    const chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
    const stopped=new Promise((resolve,reject)=>{recorder.onstop=resolve;recorder.onerror=()=>reject(new Error("The browser stopped the export."));});
    video.pause();music.pause();video.currentTime=start();video.playbackRate=Number($("speed").value);
    await new Promise(resolve=>{const fn=()=>{if(video.readyState>=2)resolve();else video.addEventListener("seeked",resolve,{once:true});};if(Math.abs(video.currentTime-start())<.02)fn();else video.addEventListener("seeked",fn,{once:true});});
    drawFrame(ctx,canvas);
    recorder.start(250);
    if(music.src){music.currentTime=0;await music.play();}
    await video.play();
    $("progressText").textContent="Rendering on your iPhone… keep this page open.";
    const draw=()=>{drawFrame(ctx,canvas);const p=Math.min(100,((video.currentTime-start())/(end()-start()))*100);$("progressBar").style.width=p+"%";$("progressText").textContent="Rendering… "+Math.round(p)+"%";if(video.currentTime>=end()||video.ended){video.pause();music.pause();if(recorder.state!=="inactive")recorder.stop();}else{raf=requestAnimationFrame(draw);}};
    raf=requestAnimationFrame(draw);
    await stopped;cancelAnimationFrame(raf);
    const blob=new Blob(chunks,{type:mime.split(";")[0]});
    if(!blob.size)throw new Error("The exported file was empty. Try a shorter clip.");
    if(exportUrl)URL.revokeObjectURL(exportUrl);
    exportUrl=URL.createObjectURL(blob);
    const ext=mime.includes("mp4")?"mp4":"webm";
    $("downloadLink").href=exportUrl;$("downloadLink").download="rt3r-edit."+ext;$("downloadLink").textContent="↓ Save your edit ("+(blob.size/1024/1024).toFixed(1)+" MB)";$("downloadLink").hidden=false;
    $("progressBar").style.width="100%";$("progressText").textContent="Export complete.";
    setStatus("Your edit is ready. On iPhone, tap the download link and use Share → Save Video if available.");
  }catch(err){cancelAnimationFrame(raf);setStatus(err.message||"Export failed. Try a shorter or smaller video.");}
  finally{
    video.pause();music.pause();$("playBtn").textContent="▶";
    if(stream)stream.getTracks().forEach(t=>t.stop());
    if(audioContext&&videoGain&&musicGain){try{videoGain.disconnect();musicGain.disconnect();videoGain.connect(audioContext.destination);musicGain.connect(audioContext.destination);}catch(e){}}
    exporting=false;$("exportBtn").disabled=false;
  }
});
window.addEventListener("beforeunload",()=>{if(videoURL)URL.revokeObjectURL(videoURL);if(musicURL)URL.revokeObjectURL(musicURL);if(exportUrl)URL.revokeObjectURL(exportUrl);});
if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
