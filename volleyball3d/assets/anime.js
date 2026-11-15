'use strict';
// Аниме-обёртка для GLB-героев из tools/make_chars.py: лицо с выражениями, тун-материалы, контур.
// Используется и игрой (index.html), и просмотрщиком (tools/viewer.html).
const ANIME=(()=>{
  const TOON=(()=>{const t=new THREE.DataTexture(new Uint8Array([105,175,255]),3,1,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t;})();
  const INK='#12162c';

  // ---------- лицо: прозрачная пластина 512x512, глаза/брови/рот ----------
  function drawFace(ch,expr){
    const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');
    g.lineCap='round';g.lineJoin='round';
    const ex=expr||'neutral',cy=222,ry=ex==='focus'?50:58,rx=42;
    g.fillStyle='rgba(255,110,130,.30)';for(const x of[118,394]){g.beginPath();g.ellipse(x,362,38,17,0,0,7);g.fill();}
    for(const sx of[-1,1]){
      const x=256+sx*104;
      if(ex==='blink'||ex==='happy'){ // закрытый глаз: дуга
        g.strokeStyle=INK;g.lineWidth=11;g.beginPath();
        if(ex==='happy')g.arc(x,cy+14,38,Math.PI*1.12,Math.PI*1.88);else{g.moveTo(x-40,cy+6);g.quadraticCurveTo(x,cy+26,x+40,cy+6);}
        g.stroke();
      }else{
        g.fillStyle='#fff';g.beginPath();g.ellipse(x,cy,rx,ry,0,0,7);g.fill();
        const gr=g.createLinearGradient(0,cy-ry,0,cy+ry);gr.addColorStop(0,'#10142a');gr.addColorStop(.34,ch.eye);gr.addColorStop(1,'#ffffff');
        g.fillStyle=gr;g.beginPath();g.ellipse(x,cy+4,rx*.82,ry*.88,0,0,7);g.fill();
        g.fillStyle='#10142a';g.beginPath();g.ellipse(x,cy+4,rx*.34,ry*.4,0,0,7);g.fill();
        g.fillStyle='#fff';g.beginPath();g.ellipse(x-rx*.28,cy-ry*.34,rx*.26,ry*.2,0,0,7);g.fill();
        g.beginPath();g.arc(x+rx*.3,cy+ry*.42,rx*.11,0,7);g.fill();
        g.strokeStyle=INK;g.lineWidth=12;g.beginPath();g.ellipse(x,cy,rx,ry,0,Math.PI*1.06,Math.PI*1.94);g.stroke();
        g.lineWidth=8;g.beginPath();g.moveTo(x+sx*rx*.95,cy-ry*.34);g.lineTo(x+sx*(rx+16),cy-ry*.52);g.stroke();
      }
      // брови: внутренний край ниже — собранный взгляд
      g.strokeStyle=ch.hair;g.lineWidth=13;g.beginPath();
      const by=cy-ry-18,inner=ex==='focus'?16:ex==='shout'?22:6;
      g.moveTo(x+sx*46,by-8);g.lineTo(x-sx*46,by+inner);g.stroke();
    }
    g.strokeStyle='#7a2a2a';g.lineWidth=9;g.beginPath();
    if(ex==='shout'){g.fillStyle='#8a1f2c';g.beginPath();g.ellipse(256,408,30,34,0,0,7);g.fill();g.stroke();g.fillStyle='#ff9aa8';g.beginPath();g.ellipse(256,422,18,12,0,0,7);g.fill();}
    else if(ex==='happy'){g.fillStyle='#8a1f2c';g.beginPath();g.moveTo(222,396);g.quadraticCurveTo(256,446,290,396);g.closePath();g.fill();g.stroke();}
    else if(ex==='focus'){g.beginPath();g.moveTo(236,410);g.lineTo(276,410);g.stroke();}
    else{g.beginPath();g.arc(256,396,22,.25,Math.PI-.25);g.stroke();}
    return c;
  }
  function faceSet(ch){
    const out={};
    for(const e of['neutral','blink','happy','shout','focus']){
      const t=new THREE.CanvasTexture(drawFace(ch,e));t.encoding=THREE.sRGBEncoding;t.anisotropy=4;t.flipY=false;out[e]=t; // flipY=false: UV из glTF уже перевёрнуты
    }
    return out;
  }

  // ---------- контур: инвертированный корпус со смещением по нормали ----------
  function outlineMat(th){
    const m=new THREE.MeshLambertMaterial({color:'#000000',emissive:INK,side:THREE.BackSide,skinning:true}); // Lambert, потому что в Basic нет objectNormal
    m.onBeforeCompile=sh=>{
      sh.vertexShader=sh.vertexShader.replace('#include <skinning_vertex>','#include <skinning_vertex>\n transformed += normalize(objectNormal)*'+th.toFixed(4)+';');
    };
    return m;
  }

  // ---------- настройка героя: имена материалов из GLB -> тун-материалы ----------
  function dress(root,ch,team,opts){
    opts=opts||{};
    const cols={Skin:ch.skin,Jersey:team.c,Shorts:team.s,Shoes:'#f7f7ff',Socks:'#f7f7ff',Hair:ch.hair,HairAccent:ch.hair2||ch.hair};
    const toon={};for(const k in cols)toon[k]=new THREE.MeshToonMaterial({color:cols[k],gradientMap:TOON,skinning:true});
    const faces=faceSet(ch);
    const faceMat=new THREE.MeshBasicMaterial({map:faces.neutral,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,skinning:true,side:THREE.DoubleSide});
    const ol=outlineMat(opts.outline||.011);
    const extra=[];
    root.traverse(o=>{
      if(!(o.isMesh||o.isSkinnedMesh)||o.userData.isOutline)return;
      o.castShadow=true;o.receiveShadow=false;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      const nm=mats.map(m=>m.name==='Face'?faceMat:(toon[m.name]||toon.Skin));
      o.material=Array.isArray(o.material)?nm:nm[0];
      if(o.name.indexOf('Face')===0)return;
      const oc=o.isSkinnedMesh?new THREE.SkinnedMesh(o.geometry,ol):new THREE.Mesh(o.geometry,ol);
      oc.userData.isOutline=true;oc.frustumCulled=false;
      if(o.isSkinnedMesh){oc.bind(o.skeleton,o.bindMatrix);}
      extra.push([o.parent,oc]);
    });
    for(const[p,oc]of extra)p.add(oc);
    return{faceMat,faces,setFace(e){faceMat.map=faces[e]||faces.neutral;},toon};
  }
  return{drawFace,faceSet,dress,TOON};
})();
