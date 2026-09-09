const $=(s)=>document.querySelector(s);const $$=(s)=>[...document.querySelectorAll(s)];

const ui={
  nav:$$('.nav button'),modes:$$('.mode'),title:$('#moduleTitle'),eyebrow:$('#moduleEyebrow'),desc:$('#moduleDesc'),
  reset:$('#resetView'),action:$('#contextAction'),hudBtn:$('#hudButton'),hud:$('#hud'),stage:$('#modelStage'),frame:$('#modelFrame'),
  loader:$('#modelLoader'),diagnostic:$('#diagnosticStage'),hint:$('#viewHint'),credit:$('#assetCredit'),name:$('#componentName'),
  status:$('#componentStatus'),description:$('#componentDesc'),creator:$('#factCreator'),license:$('#factLicense'),mesh:$('#factMesh'),
  source:$('#factSource'),sourceLink:$('#sourceLink'),simbox:$('#simbox'),simFlex:$('#simFlex'),simPitch:$('#simPitch'),simBattery:$('#simBattery')
};

const ASSETS={
  suit:{
    eyebrow:'MARK III // HIGH-FIDELITY ASSET',title:'SUIT OVERVIEW',desc:'Armadura completa em viewer 3D de maior fidelidade.',
    uid:'d6b97e705edb4b98a3cdb3856ccfe2d2',name:'IRON MAN SUIT',creator:'arnavkajjewad2008',license:'CC Attribution',mesh:'20.8k tris • 10.5k vertices',
    source:'Sketchfab',url:'https://sketchfab.com/3d-models/iron-man-suit-d6b97e705edb4b98a3cdb3856ccfe2d2',
    credit:'3D ASSET • arnavkajjewad2008 • CC BY'
  },
  gauntlet:{
    eyebrow:'WEARABLE // HIGH-FIDELITY ASSET',title:'GAUNTLET',desc:'Modelo de mão/gauntlet usado como referência visual do conjunto vestível.',
    uid:'0ac6ce69884d4f37b6018e0626cca1d7',name:'IRON MAN HAND',creator:'hasanlifurkan18072011',license:'Official hosted embed • license not asserted locally',mesh:'95.4k tris • 62.2k vertices',
    source:'Sketchfab embed',url:'https://sketchfab.com/3d-models/iron-man-hand-0ac6ce69884d4f37b6018e0626cca1d7',
    credit:'3D ASSET • hasanlifurkan18072011 • HOSTED EMBED'
  },
  helmet:{
    eyebrow:'MARK III // HIGH-FIDELITY ASSET',title:'HELMET',desc:'Mark III detalhado, com peças separadas no asset original.',
    uid:'71a03274781145699ac9f88d03609c43',name:'IRONMAN MARK III HELMET',creator:'Demonic Arts (@Jesterz86)',license:'CC Attribution',mesh:'36.3k tris • 18.7k vertices',
    source:'Sketchfab',url:'https://sketchfab.com/3d-models/ironman-mark-iii-helmet-free-71a03274781145699ac9f88d03609c43',
    credit:'3D ASSET • DEMONIC ARTS • CC BY'
  },
  reactor:{
    eyebrow:'ENERGY MODULE // HIGH-FIDELITY ASSET',title:'ARC REACTOR',desc:'Modelo detalhado baseado no Arc Reactor do MCU.',
    uid:'7daf892988e54cdcb8bfd7dff3ed5d23',name:'ARC REACTOR',creator:'Ludus101',license:'CC Attribution',mesh:'33.7k tris • 18.2k vertices',
    source:'Sketchfab',url:'https://sketchfab.com/3d-models/arc-reactor-7daf892988e54cdcb8bfd7dff3ed5d23',
    credit:'3D ASSET • LUDUS101 • CC BY'
  },
  diagnostics:{
    eyebrow:'SIMULATION // NO HARDWARE LINK',title:'DIAGNOSTICS',desc:'Simulação local para testar a interface antes da conexão com sensores reais.',
    uid:null,name:'LOCAL DIAGNOSTICS',creator:'Projeto Manopla Inteligente',license:'Projeto próprio',mesh:'Sem asset externo',source:'Interface local',url:null,credit:'SIMULATION • NO LIVE HARDWARE'
  }
};

let current='suit';let mode='clean';let hudActive=false;let simTimer=null;

function viewerUrl(uid,viewMode='clean'){
  const params=new URLSearchParams({autostart:'1',ui_infos:'0',ui_help:'0',ui_settings:'0',ui_vr:'0',ui_watermark:'1'});
  if(viewMode==='clean')params.set('ui_controls','0');
  if(viewMode==='controls')params.set('ui_controls','1');
  if(viewMode==='spin'){params.set('ui_controls','0');params.set('autospin','0.22');}
  return `https://sketchfab.com/models/${uid}/embed?${params.toString()}`;
}

function stopSimulation(){if(simTimer){clearInterval(simTimer);simTimer=null;}ui.simbox.style.display='none';}

function setAssetInfo(asset){
  ui.name.textContent=asset.name;ui.status.textContent=asset.uid?'EXTERNAL 3D':'SIMULATION';ui.description.textContent=asset.uid?'Metadados exibidos abaixo vêm da página do asset. O arquivo não é redistribuído por este projeto.':'Diagnóstico local explicitamente simulado; nenhum sensor está conectado ao site.';
  ui.creator.textContent=asset.creator;ui.license.textContent=asset.license;ui.mesh.textContent=asset.mesh;ui.source.textContent=asset.source;
  if(asset.url){ui.sourceLink.href=asset.url;ui.sourceLink.style.display='inline-flex';}else{ui.sourceLink.removeAttribute('href');ui.sourceLink.style.display='none';}
  ui.credit.textContent=asset.credit;
}

function setViewButtons(disabled){
  ui.modes.forEach(b=>{b.disabled=disabled;b.classList.toggle('active',!disabled&&b.dataset.mode===mode)});
}

function loadViewer(asset){
  ui.diagnostic.hidden=true;ui.stage.style.display='block';ui.loader.style.display='grid';ui.stage.classList.remove('ready');
  ui.frame.onload=()=>{ui.loader.style.display='none';ui.stage.classList.add('ready')};
  ui.frame.src=viewerUrl(asset.uid,mode);
}

function loadModule(id){
  const asset=ASSETS[id];if(!asset)return;current=id;hudActive=false;ui.hud.classList.remove('active');stopSimulation();
  ui.nav.forEach(b=>b.classList.toggle('active',b.dataset.module===id));ui.eyebrow.textContent=asset.eyebrow;ui.title.textContent=asset.title;ui.desc.textContent=asset.desc;setAssetInfo(asset);
  ui.hudBtn.disabled=id!=='helmet';ui.hudBtn.textContent=id==='helmet'?'ENTER HUD':'HUD LOCKED';ui.action.textContent=id==='diagnostics'?'RUN SIMULATION':'RESET MODEL';
  ui.hint.textContent=id==='diagnostics'?'VALORES GERADOS LOCALMENTE • SEM SENSOR REAL':'ARRASTE PARA GIRAR • SCROLL PARA ZOOM';
  if(id==='diagnostics'){
    ui.frame.src='about:blank';ui.stage.style.display='none';ui.diagnostic.hidden=false;setViewButtons(true);
  }else{setViewButtons(false);loadViewer(asset);}
}

function reloadViewer(){const asset=ASSETS[current];if(!asset.uid)return;loadViewer(asset);}

function setMode(next){
  if(current==='diagnostics')return;
  if(next==='fullscreen'){
    const viewport=$('#viewport');if(viewport.requestFullscreen)viewport.requestFullscreen();return;
  }
  mode=next;ui.modes.forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));reloadViewer();
}

function toggleHud(){if(current!=='helmet')return;hudActive=!hudActive;ui.hud.classList.toggle('active',hudActive);ui.hudBtn.textContent=hudActive?'EXIT HUD':'ENTER HUD';}

function runSimulation(){
  if(current!=='diagnostics')return;ui.simbox.style.display='block';
  const tick=()=>{ui.simFlex.textContent=`SIM ${Math.round(25+Math.random()*55)}%`;ui.simPitch.textContent=`SIM ${(Math.random()*12-6).toFixed(1)}°`;ui.simBattery.textContent=`SIM ${Math.round(65+Math.random()*28)}%`;};
  tick();if(simTimer)clearInterval(simTimer);simTimer=setInterval(tick,850);
}

ui.nav.forEach(b=>b.addEventListener('click',()=>loadModule(b.dataset.module)));
ui.modes.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
ui.reset.addEventListener('click',reloadViewer);
ui.action.addEventListener('click',()=>current==='diagnostics'?runSimulation():reloadViewer());
ui.hudBtn.addEventListener('click',toggleHud);

loadModule('suit');
