import {INGREDIENTS} from './recipes.js';
const C={ink:'#234d3c',wood:'#b38450',lightWood:'#dab37b',tile:'#77947c',cream:'#f3e7c7'};
function rounded(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function ellipse(ctx,x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
function line(ctx,x,y,x2,y2,color,width=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function label(ctx,text,x,y,size=10,color='#5b6650'){ctx.fillStyle=color;ctx.font=`${size}px Arial`;ctx.textAlign='center';ctx.fillText(text,x,y);}
function shadow(ctx,x,y,rx,ry){ellipse(ctx,x,y,rx,ry,'#243b2920');}
export function drawIngredient(ctx,item,x,y,size=1,chopped=false){
 ctx.save();ctx.translate(x,y);ctx.scale(size,size);
 if(chopped){for(let i=0;i<7;i++){const xx=Math.sin(i*2.4)*19,yy=Math.cos(i*2.4)*11;rounded(ctx,xx-5,yy-4,10,8,2,INGREDIENTS[item].color);line(ctx,xx-3,yy-2,xx+2,yy-2,'#ffffff40',2);}ctx.restore();return;}
 if(item==='tomato'){shadow(ctx,0,9,22,7);ellipse(ctx,-6,0,16,17,'#bd4a35');ellipse(ctx,8,-1,16,17,'#d76344');ellipse(ctx,5,-6,10,9,'#e57653');ctx.fillStyle='#4f7543';ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5,r=i%2?4:12;const xx=Math.cos(a)*r,yy=-13+Math.sin(a)*r*.45;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();line(ctx,0,-14,3,-22,'#4d6d40',3);ellipse(ctx,12,-7,3,5,'#f6c09470');}
 if(item==='mushroom'){shadow(ctx,0,14,23,6);rounded(ctx,-6,-1,13,22,5,'#e6d2ad');ellipse(ctx,0,-1,27,13,'#7b5d40');ctx.beginPath();ctx.arc(0,-2,27,Math.PI,0);ctx.fillStyle='#b89669';ctx.fill();ellipse(ctx,-6,-13,15,7,'#cdb084');for(let i=0;i<6;i++)ellipse(ctx,-18+i*7,-7+(i%2)*5,2,1.5,'#8d704b');}
 if(item==='shrimp'){shadow(ctx,0,10,23,7);ctx.lineCap='round';ctx.strokeStyle='#dd795b';ctx.lineWidth=17;ctx.beginPath();ctx.arc(1,-1,16,.4,Math.PI*1.8);ctx.stroke();ctx.strokeStyle='#f4ac83';ctx.lineWidth=11;ctx.beginPath();ctx.arc(1,-4,15,.5,Math.PI*1.7);ctx.stroke();for(let i=0;i<5;i++){const a=.6+i*.65;line(ctx,1+Math.cos(a)*10,-4+Math.sin(a)*10,1+Math.cos(a)*21,-4+Math.sin(a)*21,'#cf7156',2);}ctx.fillStyle='#dc7356';ctx.beginPath();ctx.moveTo(14,-16);ctx.lineTo(30,-20);ctx.lineTo(25,-9);ctx.closePath();ctx.fill();}
 ctx.restore();
}
function herb(ctx,x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line(ctx,0,12,0,-12,'#4d7742',2);for(let i=0;i<3;i++){ellipse(ctx,-5,-8+i*7,6,3,'#668443');ellipse(ctx,5,-11+i*7,6,3,'#416b40');}ctx.restore();}
function riceBowl(ctx,x,y,items=[],herbs=false,selected=false){
 shadow(ctx,x,y+21,63,16);ellipse(ctx,x,y+10,62,35,selected?'#c69b45':'#b1b7a0');ellipse(ctx,x,y+4,62,35,'#fcf8df');ellipse(ctx,x,y,54,29,'#e1d7b3');ellipse(ctx,x,y,47,24,'#d5b15f');
 for(let i=0;i<55;i++){const a=i*2.399,r=Math.sqrt(i/55);const xx=x+Math.cos(a)*43*r,yy=y+Math.sin(a)*21*r;ctx.save();ctx.translate(xx,yy);ctx.rotate(a);rounded(ctx,-3,-1,7,2,1,i%3?'#f5d985':'#eac96c');ctx.restore();}
 for(let i=0;i<items.length;i++){const item=items[i];const xx=x+(items.length>1?(i?19:-19):0);if(item==='tomato'){for(let j=0;j<4;j++){ellipse(ctx,xx-13+(j%2)*22,y-5+Math.floor(j/2)*12,12,8,'#bb5038');ellipse(ctx,xx-12+(j%2)*22,y-7+Math.floor(j/2)*12,10,6,'#e07b4a');line(ctx,xx-18+(j%2)*22,y-7+Math.floor(j/2)*12,xx-7+(j%2)*22,y-7+Math.floor(j/2)*12,'#f6c47b',1);}}else if(item==='mushroom'){for(let j=0;j<3;j++){ctx.save();ctx.translate(xx-12+j*12,y-8+j*7);ctx.rotate(-.3);rounded(ctx,-3,0,6,11,2,'#d6bf89');ellipse(ctx,0,0,14,7,'#9b6f44');ellipse(ctx,-2,-2,11,4,'#b88b55');ctx.restore();}}else{drawIngredient(ctx,'shrimp',xx-8,y-2,.65);drawIngredient(ctx,'shrimp',xx+12,y+6,.6);}}
 if(herbs){for(let i=0;i<5;i++)herb(ctx,x-28+i*13,y-4+Math.sin(i*2)*9,.4);}
}
function plant(ctx,x,y,size=1){ctx.save();ctx.translate(x,y);ctx.scale(size,size);shadow(ctx,0,30,24,8);rounded(ctx,-18,0,36,32,[3,3,12,12],'#c28255');ellipse(ctx,0,0,18,7,'#835b38');for(let i=0;i<7;i++){const a=-Math.PI+i*Math.PI/6;const xx=Math.cos(a)*24,yy=Math.sin(a)*34-8;line(ctx,0,3,xx,yy,'#496d40',2);ctx.save();ctx.translate(xx,yy);ctx.rotate(a+.5);ellipse(ctx,0,0,8,17,i%2?'#648b56':'#3e6c47');ctx.restore();}ctx.restore();}
function counter(ctx,x,y,w,h){rounded(ctx,x+3,y+13,w,h,9,'#4c4e3328');rounded(ctx,x,y+6,w,h,6,'#a37846');rounded(ctx,x,y,w,h-15,6,'#d9b681','#a67b47');line(ctx,x+5,y+5,x+w-5,y+5,'#eed1a0',2);for(let j=0;j<3;j++)line(ctx,x+10,y+20+j*17,x+w-10,y+20+j*17,'#b78c5538');}
function drawBackdrop(ctx){
 ctx.fillStyle='#a6b098';ctx.fillRect(0,0,1200,460);
 ctx.fillStyle='#708b75';ctx.fillRect(0,0,1200,112);
 for(let y=0;y<110;y+=28)for(let x=0;x<1200;x+=57){rounded(ctx,x+2,y+2,53,24,2,(x/57+y/28)%3?'#7e9980':'#829c82','#6a856b');line(ctx,x+5,y+4,x+51,y+4,'#ffffff16');}
 ctx.fillStyle='#ded0ae';ctx.fillRect(0,220,1200,240);
 for(let y=220;y<460;y+=46)for(let x=-50;x<1250;x+=70){const xx=x+(Math.floor(y/46)%2)*35;ctx.fillStyle=((x+50)/70+Math.floor(y/46))%2?'#e3d6b8':'#d6c6a5';ctx.fillRect(xx+1,y+1,68,44);}
 const glow=ctx.createRadialGradient(620,80,20,620,210,550);glow.addColorStop(0,'#ffefb42b');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(0,0,1200,460);
 // Morning window, set into the sage tiles.
 rounded(ctx,37,44,123,162,4,'#405f48');rounded(ctx,44,51,109,144,1,'#d3ddc4');
 ctx.fillStyle='#adc6b1';ctx.fillRect(48,55,101,136);ctx.fillStyle='#f2e6b8';ctx.beginPath();ctx.moveTo(48,55);ctx.lineTo(130,55);ctx.lineTo(48,180);ctx.fill();
 for(let i=0;i<4;i++)ellipse(ctx,62+i*25,140+Math.sin(i)*10,30,36,'#92af8c');line(ctx,98,53,98,195,'#46654d',6);line(ctx,44,111,153,111,'#46654d',5);rounded(ctx,31,199,137,10,2,'#bd9560');
 label(ctx,'SAFFRON & STEAM',100,82,7,'#5c7660');plant(ctx,102,180,.65);
 // Shelf and hanging utensils.
 rounded(ctx,202,51,894,9,3,'#bf9960');rounded(ctx,206,60,884,5,1,'#4b604b40');
 for(let i=0;i<5;i++){rounded(ctx,230+i*31,23,22,28,3,i%2?'#d3c297':'#ecd9ac');rounded(ctx,229+i*31,19,24,5,2,'#775d3f');rounded(ctx,234+i*31,32,14,9,1,'#f2e6c4');}
 label(ctx,'FRESH EVERY DAY',533,38,11,'#e8e3c1');
 for(let i=0;i<4;i++){const x=690+i*33;line(ctx,x,68,x,95,'#d4c596',3);if(i===0)ellipse(ctx,x,103,7,10,'#d4c596');else if(i===1){rounded(ctx,x-6,92,12,17,3,'#d4c596');for(let j=0;j<3;j++)line(ctx,x-3+j*3,94,x-3+j*3,104,'#728870');}else{ellipse(ctx,x,101,5,12,'#d4c596');}}
 for(let i=0;i<4;i++){rounded(ctx,895+i*31,26,23,24,5,'#ede5c6');ellipse(ctx,906+i*31,27,11,4,'#c8bd97');}plant(ctx,1060,28,.6);
 // Rear worktop and cabinet front.
 counter(ctx,190,113,925,108);ctx.fillStyle='#59795c';ctx.fillRect(195,203,915,32);for(let x=202;x<1100;x+=114){rounded(ctx,x,210,103,22,2,'#668467','#496b51');line(ctx,x+40,215,x+63,215,'#cebd83',3);}
 // Prep board.
 rounded(ctx,211,128,110,62,8,'#8f6039');rounded(ctx,209,123,110,62,8,'#bf8c55','#a57442');for(let i=0;i<6;i++)line(ctx,218,131+i*8,309,131+i*8,'#d6aa7140');ellipse(ctx,219,153,3,6,'#825735');
 // Kitchen knife.
 ctx.save();ctx.translate(334,150);ctx.rotate(.22);rounded(ctx,-4,-20,8,23,2,'#e0e0c5');line(ctx,-4,-20,-4,3,'#a3ac99');rounded(ctx,-4,3,8,24,2,'#3d5848');ellipse(ctx,0,10,1,1,'#b7bc9f');ctx.restore();
 // Hob, four brass controls.
 rounded(ctx,393,121,313,77,6,'#3a5145','#243d32');for(const x of [475,625]){ellipse(ctx,x,158,60,30,'#263a31');for(let i=0;i<4;i++){const a=i*Math.PI/2;line(ctx,x+Math.cos(a)*34,158+Math.sin(a)*20,x+Math.cos(a)*58,158+Math.sin(a)*31,'#74836b',4);}}
 for(let i=0;i<4;i++){ellipse(ctx,425+i*76,191,6,4,'#c6ac71');line(ctx,425+i*76,187,425+i*76,191,'#66563e');}
 // Bowls, oil and towels.
 rounded(ctx,730,137,13,43,3,'#a9994b');rounded(ctx,733,127,7,12,2,'#506243');ellipse(ctx,736,138,6,3,'#c5ba6d');rounded(ctx,1115,143,30,61,3,'#e6dec1');for(let x=1119;x<1142;x+=7)line(ctx,x,145,x,202,'#ae74554d',2);
 // Front pantry bench.
 counter(ctx,223,335,887,105);rounded(ctx,229,425,876,26,3,'#557357');for(let x=242;x<1090;x+=150){rounded(ctx,x,429,137,18,2,'#668467');line(ctx,x+55,432,x+80,432,'#d0b778',3);}
 for(const x of [320,470,620]){rounded(ctx,x-58,344,116,52,6,'#8b784d');rounded(ctx,x-54,347,108,45,4,'#b7ac79');for(let i=0;i<5;i++)line(ctx,x-48+i*24,350,x-48+i*24,390,'#9b885445');}
 drawIngredient(ctx,'tomato',297,365,.75);drawIngredient(ctx,'tomato',336,373,.85);drawIngredient(ctx,'tomato',322,353,.75);
 drawIngredient(ctx,'mushroom',449,371,.8);drawIngredient(ctx,'mushroom',484,364,.8);drawIngredient(ctx,'mushroom',471,382,.65);
 for(let i=0;i<5;i++)drawIngredient(ctx,'shrimp',590+(i%3)*27,359+Math.floor(i/3)*22,.6);
 rounded(ctx,720,346,93,51,5,'#ddd7b8');for(let i=0;i<9;i++)herb(ctx,734+(i%3)*28,355+Math.floor(i/3)*14,.7);
 rounded(ctx,865,344,220,51,5,'#f1e8cd','#baaa82');line(ctx,880,369,1070,369,'#c3b792',1);label(ctx,'THE PASS',972,365,10,'#92805b');label(ctx,'good food, good company',972,383,8,'#a39673');
 // Brass service bell.
 ellipse(ctx,1082,362,16,7,'#805e32');ctx.fillStyle='#c9a050';ctx.beginPath();ctx.arc(1082,359,13,Math.PI,0);ctx.fill();ellipse(ctx,1082,346,4,3,'#e2c47c');
 // Flour sack and a welcoming rug.
 rounded(ctx,50,344,93,62,14,'#ccb88a');rounded(ctx,58,339,78,10,4,'#dfcda5');label(ctx,'SAFFRON',97,370,10,'#7d774e');label(ctx,'RICE',97,386,12,'#7d774e');plant(ctx,1160,360,1.15);
 rounded(ctx,78,249,140,57,10,'#a18d5f');for(let i=0;i<8;i++)line(ctx,85,255+i*6,211,255+i*6,'#c9b888',2);
 label(ctx,'PREP',265,118,8,'#6c765a');label(ctx,'SIZZLE',550,118,8,'#6c765a');label(ctx,'PLATE & FINISH',931,118,8,'#6c765a');
}
function drawPan(ctx,pan,x,t){
 if(pan){const ready=pan.time>=INGREDIENTS[pan.item].cook;ellipse(ctx,x,161,51,26,pan.burnt?'#625245':ready?'#c6a256':'#d59443');for(let i=0;i<7;i++){const a=i*.9+t*2;ellipse(ctx,x+Math.cos(a)*41,166+Math.sin(a)*19,3,2,ready?'#edd48b':'#eeb459');}}
 rounded(ctx,x+36,151,46,9,4,'#253a31');rounded(ctx,x+60,151,24,9,4,'#946843');ellipse(ctx,x,151,48,26,'#9d9e7d');ellipse(ctx,x,149,45,23,'#293c33');ellipse(ctx,x,148,39,19,'#425245');
 if(pan){drawIngredient(ctx,pan.item,x,146,.85,true);if(pan.burnt){ellipse(ctx,x,148,30,14,'#382c24d0');}const need=INGREDIENTS[pan.item].cook;const ready=pan.time>=need;for(let i=0;i<4;i++){let yy=127-((t*17+i*11)%46);ctx.beginPath();ctx.moveTo(x-22+i*14,yy+14);ctx.quadraticCurveTo(x-28+i*14+Math.sin(t*3+i)*4,yy+3,x-22+i*14,yy-7);ctx.strokeStyle=pan.burnt?'#50493899':'#f9f4d790';ctx.lineWidth=3;ctx.stroke();}
 rounded(ctx,x-42,179,84,5,3,'#263d30');rounded(ctx,x-42,179,84*Math.min(1,pan.time/need),5,3,pan.burnt?'#b9563e':ready?'#b8cd79':'#edba61');if(ready&&!pan.burnt)label(ctx,'READY · '+Math.max(0,Math.ceil(need+11-pan.time))+'s',x,139,8,'#fff4bf');}
}
function drawChef(ctx,s,t){
 const c=s.chef,moving=Math.hypot(c.x-c.tx,c.y-c.ty)>2,bob=moving?Math.sin(t*18)*2:Math.sin(t*2)*.6;
 ctx.save();ctx.translate(c.x,c.y+bob);shadow(ctx,0,23,24,8);rounded(ctx,-13,10,10,17,4,'#304939');rounded(ctx,4,10,10,17,4,'#304939');ellipse(ctx,-8,25,10,4,'#2b3e32');ellipse(ctx,10,25,10,4,'#2b3e32');
 rounded(ctx,-23,-20,46,42,17,'#eee6ca');rounded(ctx,-12,-10,25,32,4,'#bc864e');line(ctx,-12,-13,-7,-24,'#bc864e',3);line(ctx,13,-13,7,-24,'#bc864e',3);rounded(ctx,-8,5,17,8,2,'#ce9c5e');
 ellipse(ctx,-22,1,6,9,'#bb865c');ellipse(ctx,23,0,6,9,'#bb865c');ellipse(ctx,0,-29,18,19,'#d3a278');ellipse(ctx,-6,-27,1.5,2,'#4e4a32');ellipse(ctx,7,-27,1.5,2,'#4e4a32');ctx.beginPath();ctx.arc(1,-24,6,.2,Math.PI-.2);ctx.strokeStyle='#956a49';ctx.lineWidth=1.5;ctx.stroke();
 rounded(ctx,-20,-49,40,17,5,'#f8f1d9');ellipse(ctx,-15,-50,12,11,'#faf4de');ellipse(ctx,0,-55,14,12,'#fff8e6');ellipse(ctx,15,-50,12,11,'#f6efd9');line(ctx,-16,-36,16,-36,'#d6cdb2',2);
 if(s.hand){shadow(ctx,31,-9,18,8);drawIngredient(ctx,s.hand.item,31,-13,.55,s.hand.stage!=='raw');}
 ctx.restore();
}
let backdrop;
export function renderKitchen(ctx,s,time){
 if(!backdrop){backdrop=document.createElement('canvas');backdrop.width=1200;backdrop.height=460;drawBackdrop(backdrop.getContext('2d'));}
 ctx.drawImage(backdrop,0,0);
 if(s.prep){drawIngredient(ctx,s.prep.item,265,151,.85,s.prep.chops>0);for(let i=0;i<3;i++)ellipse(ctx,246+i*18,179,4,3,i<s.prep.chops?'#e9e2a0':'#986f47');}
 drawPan(ctx,s.pans[0],475,time);drawPan(ctx,s.pans[1],625,time);
 s.plates.forEach((p,i)=>{riceBowl(ctx,i?1020:840,151,p.items,p.herbs,i===s.selectedPlate);if(i===s.selectedPlate){label(ctx,'SELECTED',i?1020:840,190,7,'#8c723a');}});
 drawChef(ctx,s,time);
 for(const p of s.particles){for(let i=0;i<8;i++){const a=i*Math.PI/4,dist=(1-p.life/1.2)*35;ellipse(ctx,p.x+Math.cos(a)*dist,p.y+Math.sin(a)*dist-15,3,3,p.color);}}
}
